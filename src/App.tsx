import React, { useState, useEffect } from 'react';
import { Timer } from './components/Timer';
import { TimerControls } from './components/TimerControls';
import { SettingsButton } from './components/SettingsButton';
import { PopoutButton } from './components/PopoutButton';
import { Settings } from './components/Settings';
import { useTimer } from './lib/useTimer';
import { DEFAULT_SETTINGS, TimerSettings } from './lib/types';
import './App.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isPopoutActive, setIsPopoutActive] = useState(false);
  const { state, toggleTimer, skipSession, speedMultiplier, toggleSpeedMode } = useTimer(settings);

  // Set up IPC communication
  useEffect(() => {
    // Check if we're in an Electron environment
    if (window.electronAPI) {
      // Listen for popout status updates
      window.electronAPI.receive('popout-status', (status: boolean) => {
        setIsPopoutActive(status);
      });

      // Listen for timer state requests
      window.electronAPI.receive('request-timer-state', () => {
        window.electronAPI?.sendMessage('timer-state-update', state);
      });

      // Listen for popout closed event
      window.electronAPI.receive('popout-closed', () => {
        setIsPopoutActive(false);
      });

      // Handle timer controls from popout window
      window.electronAPI.receive('toggle-timer', () => {
        toggleTimer();
      });

      window.electronAPI.receive('skip-session', () => {
        skipSession();
      });

      window.electronAPI.receive('toggle-speed', () => {
        toggleSpeedMode();
      });
    }
  }, [toggleTimer, skipSession, toggleSpeedMode]);

  // Send timer state updates when the state changes
  useEffect(() => {
    if (window.electronAPI && isPopoutActive) {
      window.electronAPI.sendMessage('timer-state-update', state);
    }
    
    console.log("Timer state updated:", { 
      mode: state.mode,
      timeRemaining: state.timeRemaining,
      isRunning: state.isRunning,
      completedPomodoros: state.completedPomodoros
    });
  }, [state, isPopoutActive]);

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
                  onClick={() => window.electronAPI?.sendMessage('close-popout')}
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
