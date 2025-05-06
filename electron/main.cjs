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

  console.log('Creating popout window');
  
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
    }
    popoutWindow = null;
  });
}

function setupIPC() {
  ipcMain.on('create-popout', () => {
    createPopoutWindow();
  });

  ipcMain.on('close-popout', () => {
    if (popoutWindow && !popoutWindow.isDestroyed()) {
      popoutWindow.close();
    }
  });

  ipcMain.on('toggle-timer', () => {
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
}

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