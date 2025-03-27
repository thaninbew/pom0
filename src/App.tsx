import React, { useState, useEffect } from 'react';
import { Timer } from './components/Timer';
import { TimerControls } from './components/TimerControls';
import { SettingsButton } from './components/SettingsButton';
import { Settings } from './components/Settings';
import { useTimer } from './lib/useTimer';
import { DEFAULT_SETTINGS, TimerSettings } from './lib/types';
import './App.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const { state, toggleTimer, skipSession, speedMultiplier, toggleSpeedMode } = useTimer(settings);

  useEffect(() => {
    console.log("Timer state updated:", { 
      mode: state.mode,
      timeRemaining: state.timeRemaining,
      isRunning: state.isRunning,
      completedPomodoros: state.completedPomodoros
    });
  }, [state]);

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
          <SettingsButton onClick={handleSettingsClick} />
          
          <div className="flex flex-col items-center justify-center">
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

            <div className="mt-8 text-xs text-slate-400 dark:text-slate-600">
              <div>Debug Info:</div>
              <div>Mode: {state.mode}</div>
              <div>Running: {state.isRunning ? 'Yes' : 'No'}</div>
              <div>Speed: {speedMultiplier}x</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
