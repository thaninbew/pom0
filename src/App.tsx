import React, { useState, useEffect } from 'react';
import { Timer } from './components/Timer';
import { TimerControls } from './components/TimerControls';
import { SettingsButton } from './components/SettingsButton';
import { PopoutButton } from './components/PopoutButton';
import { Settings } from './components/Settings';
import { PopoutTimer } from './components/PopoutTimer';
import { useTimer } from './lib/useTimer';
import { DEFAULT_SETTINGS, TimerSettings } from './lib/types';
import './App.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isPopoutActive, setIsPopoutActive] = useState(false);
  const { state, toggleTimer, skipSession, speedMultiplier, toggleSpeedMode } = useTimer(settings);

  const isPopoutMode = window.location.search.includes('mode=popout');
  
  useEffect(() => {
    console.log("App: Initializing, mode:", isPopoutMode ? "popout" : "normal");
  }, [isPopoutMode]);

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

  if (isPopoutMode) {
    return <PopoutTimer />;
  }

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

  const handlePopoutClick = () => {
    console.log("App: Creating popout window");
    if (window.electronAPI) {
      window.electronAPI.sendMessage('create-popout');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      {showSettings ? (
        <Settings 
          onBack={handleBackFromSettings}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      ) : (
        <div className="w-full max-w-md p-8 relative">
          <PopoutButton onClick={handlePopoutClick} isPopoutActive={isPopoutActive} />
          <SettingsButton onClick={handleSettingsClick} />
          
          <div className="flex flex-col items-center justify-center">
            {!isPopoutActive && (
              <>
                <Timer 
                  mode={state.mode} 
                  timeRemaining={state.timeRemaining} 
                />
                
                <div className="mt-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                  Completed: {state.completedPomodoros}
                </div>
                
                <TimerControls 
                  isRunning={state.isRunning} 
                  onToggle={toggleTimer} 
                  onSkip={skipSession}
                  speedMultiplier={speedMultiplier}
                  onToggleSpeed={toggleSpeedMode}
                />
              </>
            )}

            {isPopoutActive && (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">
                  Timer is currently in popout mode
                </p>
                <button 
                  onClick={() => {
                    console.log("App: Closing popout window");
                    window.electronAPI?.sendMessage('close-popout');
                  }}
                  className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-md text-sm"
                >
                  Close Popout
                </button>
              </div>
            )}

            {!isPopoutActive && (
              <div className="mt-8 text-xs text-slate-400 dark:text-slate-600">
                <div>Debug Info:</div>
                <div>Mode: {state.mode}</div>
                <div>Running: {state.isRunning ? 'Yes' : 'No'}</div>
                <div>Speed: {speedMultiplier}x</div>
                <div>Electron: {window.electronAPI ? 'Available' : 'Not Available'}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
