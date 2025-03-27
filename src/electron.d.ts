interface ElectronAPI {
  sendMessage: (channel: string, data?: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
  receiveOnce: (channel: string, func: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {}; 