const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
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
    backgroundColor: '#000000',
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

  console.log('Creating popout window');
  
  popoutWindow = new BrowserWindow({
    width: 400,
    height: 300,
    minWidth: 300,
    minHeight: 250,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const popoutUrl = isDev
    ? 'http://localhost:5173?mode=popout'
    : `file://${path.join(__dirname, '../dist/index.html?mode=popout')}`;
    
  console.log('Loading popout URL:', popoutUrl);
  
  popoutWindow.loadURL(popoutUrl);

  popoutWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load popout window:', errorCode, errorDescription);
  });

  popoutWindow.webContents.on('did-finish-load', () => {
    console.log('Popout window loaded successfully');
  });

  if (isDev) {
    popoutWindow.webContents.openDevTools({ mode: 'detach' });
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('popout-status', true);
  }

  popoutWindow.on('closed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('popout-status', false);
      mainWindow.webContents.send('popout-closed');
      
      // Activate the main window to bring it to the foreground
      console.log('Activating main window after popout closure');
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

function setupIPC() {
  ipcMain.on('create-popout', () => {
    createPopoutWindow();
  });

  ipcMain.on('close-popout', () => {
    if (popoutWindow && !popoutWindow.isDestroyed()) {
      popoutWindow.close();
    }
    
    // Activate the main window to bring it to the foreground
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('Activating main window after popout closure');
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
      mainWindow.moveTop(); // Ensures window is on top of other applications
    }
  });

  ipcMain.on('toggle-timer', () => {
    console.log('Received toggle-timer command, broadcasting to all windows');
    broadcastToAll('toggle-timer');
  });

  ipcMain.on('skip-session', () => {
    broadcastToAll('skip-session');
  });

  ipcMain.on('toggle-speed', () => {
    broadcastToAll('toggle-speed');
  });

  ipcMain.on('timer-state-update', (event, state) => {
    broadcastToAll('timer-state-update', state, event.sender);
  });

  ipcMain.on('request-timer-state', (event) => {
    console.log('Received request for timer state, forwarding to main window');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-timer-state');
    }
  });

  ipcMain.on('popout-unmounting', () => {
    console.log('Popout is unmounting');
  });
  
  ipcMain.on('quit-app', () => {
    console.log('Quitting application');
    app.quit();
  });
  
  ipcMain.on('activate-window', () => {
    activateWindow();
  });
}

function broadcastToAll(channel, data, sender = null) {
  const windows = [
    mainWindow && !mainWindow.isDestroyed() ? mainWindow : null,
    popoutWindow && !popoutWindow.isDestroyed() ? popoutWindow : null
  ].filter(Boolean);

  console.log(`Broadcasting '${channel}' to ${windows.length} windows`);
  
  windows.forEach(win => {
    if (win && win.webContents !== sender) {
      try {
        win.webContents.send(channel, data);
        console.log(`Successfully sent '${channel}' to window ${win === mainWindow ? 'main' : 'popout'}`);
      } catch (err) {
        console.error(`Failed to send '${channel}' to window:`, err);
      }
    }
  });
}

function setupGlobalShortcuts() {
  // Register Ctrl+Shift+0 to activate the window
  globalShortcut.register('CommandOrControl+Shift+0', () => {
    console.log('Activating window from global shortcut');
    activateWindow();
  });
}

app.on('ready', () => {
  createWindow();
  setupIPC();
  setupGlobalShortcuts();
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

// Unregister global shortcuts when app is about to quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
}); 