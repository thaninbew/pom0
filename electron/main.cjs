const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

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
    backgroundColor: '#f8fafc',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
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

  popoutWindow = new BrowserWindow({
    width: 300,
    height: 200,
    minWidth: 200,
    minHeight: 150,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    backgroundColor: '#f8fafc',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Load the popout HTML file
  popoutWindow.loadURL(
    isDev
      ? 'http://localhost:5173/popout.html'
      : `file://${path.join(__dirname, '../dist/popout.html')}`
  );

  // Notify main window that popout is created
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('popout-status', true);
  }

  popoutWindow.on('closed', () => {
    // Notify main window that popout is closed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('popout-status', false);
      mainWindow.webContents.send('popout-closed');
    }
    popoutWindow = null;
  });
}

// Set up IPC handlers
function setupIPC() {
  // Handler for creating popout window
  ipcMain.on('create-popout', () => {
    createPopoutWindow();
  });

  // Handler for closing popout window
  ipcMain.on('close-popout', () => {
    if (popoutWindow && !popoutWindow.isDestroyed()) {
      popoutWindow.close();
    }
  });

  // Timer controls
  ipcMain.on('toggle-timer', () => {
    broadcastToAll('toggle-timer');
  });

  ipcMain.on('skip-session', () => {
    broadcastToAll('skip-session');
  });

  ipcMain.on('toggle-speed', () => {
    broadcastToAll('toggle-speed');
  });

  // Timer state updates
  ipcMain.on('timer-state-update', (event, state) => {
    broadcastToAll('timer-state-update', state, event.sender);
  });

  // Timer state requests
  ipcMain.on('request-timer-state', (event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-timer-state');
    }
  });
}

// Helper function to broadcast messages to all windows except sender
function broadcastToAll(channel, data, sender = null) {
  const windows = [
    mainWindow && !mainWindow.isDestroyed() ? mainWindow : null,
    popoutWindow && !popoutWindow.isDestroyed() ? popoutWindow : null
  ].filter(Boolean);

  windows.forEach(win => {
    if (win && win.webContents !== sender) {
      win.webContents.send(channel, data);
    }
  });
}

app.on('ready', () => {
  createWindow();
  setupIPC();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
}); 