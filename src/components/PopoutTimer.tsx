import React, { useState, useEffect } from 'react';
import { TimerMode, TimerState } from '../lib/types';
import { cn } from '../lib/utils';

export function PopoutTimer() {
  const [timerState, setTimerState] = useState<TimerState>({
    mode: TimerMode.WORK,
    timeRemaining: 25 * 60, 
    isRunning: false,
    completedPomodoros: 0,
    pomodorosUntilLongBreak: 4,
  });
  
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("PopoutTimer: Component mounted");
    
    if (window.electronAPI) {
      console.log("PopoutTimer: Requesting timer state");
      window.electronAPI.sendMessage('request-timer-state');
      setIsConnected(true);
    } else {
      console.log("PopoutTimer: electronAPI not available");
      setIsConnected(false);
    }

  
    window.electronAPI?.receive('timer-state-update', (data: unknown) => {
      console.log("PopoutTimer: Received timer state update", data);
      if (data && typeof data === 'object' && 'mode' in data && 'timeRemaining' in data) {
        setTimerState(data as TimerState);
      }
    });


    return () => {
      console.log("PopoutTimer: Component unmounting");
      window.electronAPI?.sendMessage('popout-unmounting');
    };
  }, []);

 
  const minutes = Math.floor(timerState.timeRemaining / 60);
  const seconds = timerState.timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleToggleTimer = () => {
    console.log("PopoutTimer: Toggle timer clicked");
    window.electronAPI?.sendMessage('toggle-timer');
  };

  const handleSkipSession = () => {
    console.log("PopoutTimer: Skip session clicked");
    window.electronAPI?.sendMessage('skip-session');
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="draggable w-full h-full p-4 flex flex-col items-center justify-center">
        {!isConnected && (
          <div className="text-red-500 mb-4 font-medium">Not connected to main window</div>
        )}
        
        <div className={cn(
          "text-7xl font-bold mb-2",
          timerState.mode === TimerMode.WORK ? "text-slate-800 dark:text-slate-100" : 
          timerState.mode === TimerMode.SHORT_BREAK ? "text-green-600 dark:text-green-400" : 
          "text-blue-600 dark:text-blue-400"
        )}>
          {formattedTime}
        </div>
        
        <div className="mt-1 mb-4 text-sm text-slate-500 dark:text-slate-400">
          Completed: {timerState.completedPomodoros}
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={handleToggleTimer}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-medium non-draggable",
              "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
              "dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90"
            )}
          >
            {timerState.isRunning ? 'Pause' : 'Start'}
          </button>
          
          <button 
            onClick={handleSkipSession}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-medium non-draggable",
              "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
              "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            )}
          >
            Skip
          </button>
        </div>
        
        <div className="mt-4 text-xs text-slate-400">
          {timerState.mode === TimerMode.WORK ? "Focus Time" : 
           timerState.mode === TimerMode.SHORT_BREAK ? "Short Break" : "Long Break"}
        </div>
      </div>
    </div>
  );
} 