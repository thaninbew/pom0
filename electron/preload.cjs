const { contextBridge, ipcRenderer } = require("electron");

// Define valid channels for security
const validSendChannels = [
  "toggle-timer",
  "skip-session",
  "toggle-speed",
  "create-popout",
  "close-popout",
  "request-timer-state",
  "update-settings",
  "quit-app",
  "activate-window",
  "popout-unmounting",
];

const validReceiveChannels = [
  "timer-state-update",
  "popout-status",
  "popout-closed",
];

// Create a secure, structured API
contextBridge.exposeInMainWorld("timerAPI", {
  // Timer commands
  timer: {
    toggle: () => ipcRenderer.send("toggle-timer"),
    skip: () => ipcRenderer.send("skip-session"),
    toggleSpeed: () => ipcRenderer.send("toggle-speed"),
    requestState: () => ipcRenderer.send("request-timer-state"),
    onStateUpdate: (callback) => {
      ipcRenderer.on("timer-state-update", (_, state) => callback(state));
    },
    updateSettings: (settings) => ipcRenderer.send("update-settings", settings),
  },

  // Window controls
  window: {
    createPopout: () => ipcRenderer.send("create-popout"),
    closePopout: () => ipcRenderer.send("close-popout"),
    onPopoutStatus: (callback) => {
      ipcRenderer.on("popout-status", (_, status) => callback(status));
    },
    onPopoutClosed: (callback) => {
      ipcRenderer.on("popout-closed", () => callback());
    },
    activate: () => ipcRenderer.send("activate-window"),
    quit: () => ipcRenderer.send("quit-app"),
  },

  // Legacy API for backward compatibility - will be removed after migration
  electronAPI: {
    sendMessage: (channel, data) => {
      if (validSendChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      } else {
        console.warn(
          `Blocked attempt to send to unauthorized channel: ${channel}`,
        );
      }
    },
    receive: (channel, func) => {
      if (validReceiveChannels.includes(channel)) {
        ipcRenderer.on(channel, (_, ...args) => func(...args));
      } else {
        console.warn(
          `Blocked attempt to receive from unauthorized channel: ${channel}`,
        );
      }
    },
    receiveOnce: (channel, func) => {
      if (validReceiveChannels.includes(channel)) {
        ipcRenderer.once(channel, (_, ...args) => func(...args));
      } else {
        console.warn(
          `Blocked attempt to receive once from unauthorized channel: ${channel}`,
        );
      }
    },
  },
});

// Clean up event listeners when window is unloaded
window.addEventListener("unload", () => {
  ipcRenderer.send("popout-unmounting");

  // Clean up all listeners
  validReceiveChannels.forEach((channel) => {
    ipcRenderer.removeAllListeners(channel);
  });
});

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ["chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
