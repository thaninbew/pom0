import React, { useState, useEffect } from 'react';
import { TerminalSettings } from './components/TerminalSettings';
import { TerminalUI } from './components/TerminalUI';
import { TerminalPopout } from './components/TerminalPopout';
import { useTimer } from './lib/useTimer';
import { DEFAULT_SETTINGS, TimerSettings } from './lib/types';
import './App.css';
import './components/Terminal.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isPopoutActive, setIsPopoutActive] = useState(false);
  const { state, toggleTimer, skipSession, toggleSpeedMode } = useTimer(settings);
  const [showHotkey, setShowHotkey] = useState(true);

  const isPopoutMode = window.location.search.includes('mode=popout');
  
  useEffect(() => {
    console.log("App: Initializing, mode:", isPopoutMode ? "popout" : "normal");
  }, [isPopoutMode]);

  // Hide hotkey message after 10 seconds
  useEffect(() => {
    const hotKeyTimer = setTimeout(() => {
      setShowHotkey(false);
    }, 10000);
    
    return () => clearTimeout(hotKeyTimer);
  }, []);

  useEffect(() => {
    console.log("App: Setting up IPC communication");
    
    if (window.electronAPI) {
      console.log("App: Electron API is available");
      
      if (!isPopoutMode) {
        window.electronAPI.receive('popout-status', (status: unknown) => {
          console.log("App: Received popout status", status);
          if (typeof status === 'boolean') {
            setIsPopoutActive(status);
          }
        });

        window.electronAPI.receive('popout-closed', () => {
          console.log("App: Received popout closed event");
          setIsPopoutActive(false);
        });
      }

      // These listeners are needed in both windows
      window.electronAPI.receive('request-timer-state', () => {
        console.log("App: Received timer state request, sending state", state);
        window.electronAPI?.sendMessage('timer-state-update', state);
      });

      window.electronAPI.receive('toggle-timer', () => {
        console.log("App: Received toggle timer command");
        toggleTimer();
      });

      window.electronAPI.receive('skip-session', () => {
        console.log("App: Received skip session command");
        skipSession();
      });

      window.electronAPI.receive('toggle-speed', () => {
        console.log("App: Received toggle speed command");
        toggleSpeedMode();
      });
      
      window.electronAPI.receive('quit-app', () => {
        console.log("App: Received quit app command");
        window.electronAPI?.sendMessage('quit-app');
      });
    } else {
      console.log("App: Electron API is not available");
    }
    
    return () => {
      console.log("App: Cleaning up IPC listeners");
    };
  }, [toggleTimer, skipSession, toggleSpeedMode, isPopoutMode, state]);

  useEffect(() => {
    if (window.electronAPI && (isPopoutActive || isPopoutMode)) {
      console.log("App: Sending timer state update", state);
      window.electronAPI.sendMessage('timer-state-update', state);
    }
    
    console.log("Timer state updated:", { 
      mode: state.mode,
      timeRemaining: state.timeRemaining,
      isRunning: state.isRunning,
      completedPomodoros: state.completedPomodoros
    });
  }, [state, isPopoutActive, isPopoutMode]);

  // Add keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings) return;
      
      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          e.stopPropagation();
          handleFreeze();
          break;
        case 's':
          e.preventDefault();
          e.stopPropagation();
          handleSkip();
          break;
        case 'p':
          e.preventDefault();
          e.stopPropagation();
          if (isPopoutActive) {
            handleClosePopout();
          } else {
            handlePopout();
          }
          break;
        case 'e':
          e.preventDefault();
          e.stopPropagation();
          handleSettingsClick();
          break;
        case 'q':
          e.preventDefault();
          e.stopPropagation();
          handleQuit();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleTimer, skipSession, state, showSettings, isPopoutActive]);

  if (isPopoutMode) {
    return <TerminalPopout />;
  }

  const handleFreeze = () => {
    toggleTimer();
  };

  const handleSkip = () => {
    skipSession();
  };

  const handleSettingsClick = () => {
    if (state.isRunning) {
      toggleTimer();
    }
    setShowSettings(true);
  };

  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  const handleUpdateSettings = (newSettings: TimerSettings) => {
    console.log("Updating settings:", newSettings);
    setSettings(newSettings);
  };

  const handlePopout = () => {
    console.log("App: Creating popout window");
    if (window.electronAPI) {
      window.electronAPI.sendMessage('create-popout');
    }
  };

  const handleClosePopout = () => {
    console.log("App: Closing popout window");
    if (window.electronAPI) {
      window.electronAPI.sendMessage('close-popout');
    }
  };

  const handleQuit = () => {
    console.log("App: Quitting app");
    if (window.electronAPI) {
      window.electronAPI.sendMessage('quit-app');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-black">
      {showSettings ? (
        <TerminalSettings 
          onBack={handleBackFromSettings}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {!isPopoutActive ? (
            <>
              <TerminalUI 
                state={state}
                onToggleTimer={handleFreeze}
                onSkipSession={handleSkip}
                onSettings={handleSettingsClick}
                onPopout={handlePopout}
                onQuit={handleQuit}
                showHotkey={showHotkey}
              />
              {/* Show a tooltip about the global shortcut on launch */}
              {showHotkey && (
                <div className="fixed bottom-4 right-4 text-green-400 text-sm font-mono">
                  Press Ctrl+Shift+0 anytime to activate pom0
                </div>
              )}
            </>
          ) : (
            <div className="terminal-container">
              <pre className="terminal">
{`┌──────────────────────────────────────────────┐
│ pom0@v1.0           [Ctrl+Shift+0][ACTIVE]   │
│──────────────────────────────────────────────│
│                                              │
│ Timer is currently in popout mode            │
│                                              │
${showHotkey ? '│ Press Ctrl+Shift+0 anytime to activate pom0    │\n' : ''}│ [p]opin                        [q]uit        │
└──────────────────────────────────────────────┘`}
              </pre>
              <div className="terminal-controls">
                <div className="terminal-grid">
                  <button 
                    onClick={handleClosePopout}
                    className="terminal-btn popin-btn"
                    aria-label="Close Popout"
                  >
                    Popin (p)
                  </button>
                  <button 
                    onClick={handleQuit}
                    className="terminal-btn quit-btn"
                    aria-label="Quit"
                  >
                    Quit (q)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
