const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");

// Define TimerMode enum
const TimerMode = {
  WORK: "work",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
};

// Timer Settings - default values
const DEFAULT_SETTINGS = {
  workDuration: 25 * 60, // 25 minutes in seconds
  shortBreakDuration: 5 * 60, // 5 minutes in seconds
  longBreakDuration: 15 * 60, // 15 minutes in seconds
  pomodorosUntilLongBreak: 4,
};

// Main process timer state
let timerState = {
  mode: TimerMode.WORK,
  timeRemaining: DEFAULT_SETTINGS.workDuration,
  isRunning: false,
  completedPomodoros: 0,
  pomodorosUntilLongBreak: DEFAULT_SETTINGS.pomodorosUntilLongBreak,
  settings: { ...DEFAULT_SETTINGS },
  speedMultiplier: 1,
};

// Timer interval reference
let timerInterval = null;
let isTransitioning = false;

// Window references
let mainWindow = null;
let popoutWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    frame: true,
    show: false,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.loadURL(
    isDev
      ? "http://localhost:5173"
      : `file://${path.join(__dirname, "../dist/index.html")}`,
  );

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    // Close the popout window if it exists when main window is closed
    if (popoutWindow && !popoutWindow.isDestroyed()) {
      popoutWindow.close();
    }
    mainWindow = null;
  });
}

function createPopoutWindow() {
  // Don't create multiple popout windows
  if (popoutWindow) {
    popoutWindow.focus();
    return;
  }

  console.log("Creating popout window");

  popoutWindow = new BrowserWindow({
    width: 400,
    height: 300,
    minWidth: 300,
    minHeight: 250,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    backgroundColor: "#000000",
    transparent: false,
    hasShadow: false, // Remove window shadow
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
      backgroundThrottling: false, // Prevent throttling when in background
    },
  });

  // Make window draggable from anywhere
  popoutWindow.setMovable(true);

  const popoutUrl = isDev
    ? "http://localhost:5173?mode=popout"
    : `file://${path.join(__dirname, "../dist/index.html?mode=popout")}`;

  console.log("Loading popout URL:", popoutUrl);

  popoutWindow.loadURL(popoutUrl);

  popoutWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error(
        "Failed to load popout window:",
        errorCode,
        errorDescription,
      );
    },
  );

  popoutWindow.webContents.on("did-finish-load", () => {
    console.log("Popout window loaded successfully");
    // Send current timer state to popout window
    broadcastTimerState();
  });

  if (isDev) {
    popoutWindow.webContents.openDevTools({ mode: "detach" });
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("popout-status", true);
  }

  popoutWindow.on("closed", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("popout-status", false);
      mainWindow.webContents.send("popout-closed");

      // Activate the main window to bring it to the foreground
      console.log("Activating main window after popout closure");
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
      mainWindow.moveTop(); // Ensures window is on top of other applications
    }
    popoutWindow = null;
  });
}

function activateWindow() {
  if (popoutWindow && !popoutWindow.isDestroyed()) {
    if (popoutWindow.isMinimized()) popoutWindow.restore();
    popoutWindow.focus();
  } else if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
}

// Timer logic functions
function getTimeForMode(mode) {
  switch (mode) {
    case TimerMode.WORK:
      return timerState.settings.workDuration;
    case TimerMode.SHORT_BREAK:
      return timerState.settings.shortBreakDuration;
    case TimerMode.LONG_BREAK:
      return timerState.settings.longBreakDuration;
    default:
      return timerState.settings.workDuration;
  }
}

function handleSessionComplete() {
  try {
    console.log("Session completed! Current mode:", timerState.mode);

    if (timerState.mode === TimerMode.WORK) {
      const completedPomodoros = timerState.completedPomodoros + 1;
      console.log("Completed pomodoros incremented to:", completedPomodoros);

      const isLongBreakDue =
        completedPomodoros % timerState.settings.pomodorosUntilLongBreak === 0;

      if (isLongBreakDue) {
        console.log("Starting long break");
        timerState = {
          ...timerState,
          mode: TimerMode.LONG_BREAK,
          timeRemaining: timerState.settings.longBreakDuration,
          completedPomodoros,
        };
      } else {
        console.log("Starting short break");
        timerState = {
          ...timerState,
          mode: TimerMode.SHORT_BREAK,
          timeRemaining: timerState.settings.shortBreakDuration,
          completedPomodoros,
        };
      }
    } else {
      console.log("Break completed, starting work session");
      timerState = {
        ...timerState,
        mode: TimerMode.WORK,
        timeRemaining: timerState.settings.workDuration,
      };
    }
  } catch (error) {
    console.error("Error during session transition:", error);
    timerState = {
      ...timerState,
      mode: TimerMode.WORK,
      timeRemaining: timerState.settings.workDuration,
    };
  }

  // Broadcast the new state to all windows
  broadcastTimerState();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log("Timer stopped");
  }
}

function startTimer() {
  stopTimer();

  console.log(
    "Starting timer with speed multiplier:",
    timerState.speedMultiplier,
  );

  timerInterval = setInterval(() => {
    if (isTransitioning) {
      return;
    }

    const timeToDecrease = timerState.speedMultiplier;
    const newTimeRemaining = Math.max(
      0,
      timerState.timeRemaining - timeToDecrease,
    );

    timerState.timeRemaining = newTimeRemaining;

    // Broadcast updated time to all windows
    broadcastTimerState();

    if (newTimeRemaining === 0) {
      console.log("Timer reached zero");

      isTransitioning = true;

      setTimeout(() => {
        handleSessionComplete();
        isTransitioning = false;
      }, 100);
    }
  }, 1000 / timerState.speedMultiplier);
}

function toggleTimer() {
  timerState.isRunning = !timerState.isRunning;

  console.log("Toggle timer:", timerState.isRunning ? "starting" : "stopping");

  if (timerState.isRunning) {
    if (timerState.timeRemaining <= 0) {
      timerState.timeRemaining = getTimeForMode(timerState.mode);
      console.log("Resetting time to", timerState.timeRemaining);
    }

    startTimer();
  } else {
    stopTimer();
  }

  // Broadcast the new state to all windows
  broadcastTimerState();
}

function skipSession() {
  if (isTransitioning) {
    console.log("Skip blocked - already transitioning");
    return;
  }

  console.log("Skipping to next session");
  isTransitioning = true;

  const wasRunning = timerState.isRunning;

  if (wasRunning) {
    stopTimer();
  }

  handleSessionComplete();

  isTransitioning = false;

  if (wasRunning) {
    startTimer();
  }

  // Broadcast the new state to all windows
  broadcastTimerState();
}

function toggleSpeedMode() {
  timerState.speedMultiplier = timerState.speedMultiplier === 1 ? 60 : 1;
  console.log("Changing speed multiplier to:", timerState.speedMultiplier);

  if (timerState.isRunning) {
    stopTimer();
    startTimer();
  }

  // Broadcast the new state to all windows
  broadcastTimerState();
}

function updateSettings(newSettings) {
  console.log("Updating settings:", newSettings);

  timerState.settings = { ...newSettings };
  timerState.pomodorosUntilLongBreak = newSettings.pomodorosUntilLongBreak;

  if (!timerState.isRunning) {
    timerState.timeRemaining = getTimeForMode(timerState.mode);
  }

  // Broadcast the new state to all windows
  broadcastTimerState();
}

function broadcastTimerState() {
  const windows = [
    mainWindow && !mainWindow.isDestroyed() ? mainWindow : null,
    popoutWindow && !popoutWindow.isDestroyed() ? popoutWindow : null,
  ].filter(Boolean);

  console.log(`Broadcasting timer state to ${windows.length} windows`);

  windows.forEach((win) => {
    try {
      win.webContents.send("timer-state-update", timerState);
      console.log(
        `Successfully sent timer state to window ${win === mainWindow ? "main" : "popout"}`,
      );
    } catch (err) {
      console.error(`Failed to send timer state to window:`, err);
    }
  });
}

function setupIPC() {
  ipcMain.on("toggle-timer", () => {
    timerState.isRunning = !timerState.isRunning;
    console.log("Timer toggled:", timerState.isRunning ? "running" : "paused");

    if (timerState.isRunning) {
      startTimer();
    } else {
      stopTimer();
    }

    broadcastTimerState();
  });

  ipcMain.on("skip-session", () => {
    console.log("Skipping current session");
    isTransitioning = true;
    stopTimer();
    handleSessionComplete();
    isTransitioning = false;
  });

  ipcMain.on("toggle-speed", () => {
    timerState.speedMultiplier = timerState.speedMultiplier === 1 ? 5 : 1;
    console.log("Timer speed set to:", timerState.speedMultiplier);
    
    if (timerState.isRunning) {
      stopTimer();
      startTimer(); // Restart with new speed
    }
    
    broadcastTimerState();
  });

  ipcMain.on("create-popout", () => {
    createPopoutWindow();
  });

  ipcMain.on("close-popout", () => {
    if (popoutWindow && !popoutWindow.isDestroyed()) {
      popoutWindow.close();
    }
  });

  ipcMain.on("request-timer-state", (event) => {
    event.sender.send("timer-state-update", timerState);
  });

  ipcMain.on("update-settings", (event, settings) => {
    console.log("Received settings update:", settings);
    
    timerState = {
      ...timerState,
      settings: { ...settings },
      pomodorosUntilLongBreak: settings.pomodorosUntilLongBreak,
    };
    
    // Update the current timeRemaining if needed
    if (!timerState.isRunning) {
      timerState.timeRemaining = getTimeForMode(timerState.mode);
    }
    
    broadcastTimerState();
  });

  ipcMain.on("activate-window", () => {
    activateWindow();
  });

  ipcMain.on("quit-app", () => {
    app.quit();
  });

  // Add handler for resize window
  ipcMain.on("resize-window", (event, { width, height }) => {
    try {
      const sourceWindow = BrowserWindow.fromWebContents(event.sender);
      if (sourceWindow && !sourceWindow.isDestroyed()) {
        sourceWindow.setSize(width, height);
      }
    } catch (err) {
      console.error("Error resizing window:", err);
    }
  });

  // Add handler for getting window bounds
  ipcMain.on("get-window-bounds", (event) => {
    try {
      const sourceWindow = BrowserWindow.fromWebContents(event.sender);
      if (sourceWindow && !sourceWindow.isDestroyed()) {
        const bounds = sourceWindow.getBounds();
        event.sender.send("window-bounds", bounds);
      }
    } catch (err) {
      console.error("Error getting window bounds:", err);
      event.sender.send("window-bounds", { width: 400, height: 300 });
    }
  });
}

function broadcastToAll(channel, data, sender = null) {
  const windows = [
    mainWindow && !mainWindow.isDestroyed() ? mainWindow : null,
    popoutWindow && !popoutWindow.isDestroyed() ? popoutWindow : null,
  ].filter(Boolean);

  console.log(`Broadcasting '${channel}' to ${windows.length} windows`);

  windows.forEach((win) => {
    if (win && win.webContents !== sender) {
      try {
        win.webContents.send(channel, data);
        console.log(
          `Successfully sent '${channel}' to window ${win === mainWindow ? "main" : "popout"}`,
        );
      } catch (err) {
        console.error(`Failed to send '${channel}' to window:`, err);
      }
    }
  });
}

function setupGlobalShortcuts() {
  // Register Ctrl+Shift+0 to activate the window
  globalShortcut.register("CommandOrControl+Shift+0", () => {
    console.log("Activating window from global shortcut");
    activateWindow();
  });
}

app.on("ready", () => {
  createWindow();
  setupIPC();
  setupGlobalShortcuts();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Unregister global shortcuts when app is about to quit
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
