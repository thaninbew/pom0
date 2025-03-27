import React, { useState, useEffect } from 'react';
import { TimerMode, TimerState } from '../lib/types';
import { cn } from '../lib/utils';

export function PopoutTimer() {
  const [timerState, setTimerState] = useState<TimerState>({
    mode: TimerMode.WORK,
    timeRemaining: 25 * 60, // Default to 25 minutes
    isRunning: false,
    completedPomodoros: 0,
    pomodorosUntilLongBreak: 4,
  });

  useEffect(() => {
    // Request initial timer state when component mounts
    window.electronAPI?.sendMessage('request-timer-state');

    // Listen for timer state updates
    window.electronAPI?.receive('timer-state-update', (data: unknown) => {
      if (data && typeof data === 'object' && 'mode' in data && 'timeRemaining' in data) {
        setTimerState(data as TimerState);
      }
    });

    // Cleanup listeners when component unmounts
    return () => {
      window.electronAPI?.sendMessage('popout-unmounting');
    };
  }, []);

  // Format time as mm:ss
  const minutes = Math.floor(timerState.timeRemaining / 60);
  const seconds = timerState.timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleToggleTimer = () => {
    window.electronAPI?.sendMessage('toggle-timer');
  };

  const handleSkipSession = () => {
    window.electronAPI?.sendMessage('skip-session');
  };

  return (
    <div className="draggable p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg shadow-lg">
      <div className={cn(
        "text-6xl font-bold mb-2",
        timerState.mode === TimerMode.WORK ? "text-slate-800 dark:text-slate-100" : 
        timerState.mode === TimerMode.SHORT_BREAK ? "text-green-600 dark:text-green-400" : 
        "text-blue-600 dark:text-blue-400"
      )}>
        {formattedTime}
      </div>
      
      <div className="mt-1 mb-3 text-sm text-slate-500 dark:text-slate-400">
        Completed: {timerState.completedPomodoros}
      </div>
      
      <div className="flex space-x-2">
        <button 
          onClick={handleToggleTimer}
          className={cn(
            "px-4 py-1 rounded-md text-sm font-medium non-draggable",
            "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
            "dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90"
          )}
        >
          {timerState.isRunning ? 'Pause' : 'Start'}
        </button>
        
        <button 
          onClick={handleSkipSession}
          className={cn(
            "px-4 py-1 rounded-md text-sm font-medium non-draggable",
            "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
            "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          )}
        >
          Skip
        </button>
      </div>
    </div>
  );
} 