const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    frame: true,
    show: false, // Hide the window until it's ready
    backgroundColor: '#f8fafc', // Light background
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Load the index.html from a url
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:5173' // Vite dev server
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );

  // Show window when ready to avoid flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools if in dev mode
  if (isDev) {
    // Open DevTools in a separate window
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

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