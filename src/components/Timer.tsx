import React from 'react';
import { TimerMode } from '../lib/types';
import { cn } from '../lib/utils';

interface TimerProps {
  mode: TimerMode;
  timeRemaining: number;
}

export function Timer({ mode, timeRemaining }: TimerProps) {
  // Format time as mm:ss
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "text-6xl font-bold mb-4",
        mode === TimerMode.WORK ? "text-slate-800 dark:text-slate-100" : 
        mode === TimerMode.SHORT_BREAK ? "text-green-600 dark:text-green-400" : 
        "text-blue-600 dark:text-blue-400"
      )}>
        {formattedTime}
      </div>
      <div className="text-xl font-medium text-slate-600 dark:text-slate-300">
        {mode === TimerMode.WORK ? "Focus Time" : 
         mode === TimerMode.SHORT_BREAK ? "Short Break" : "Long Break"}
      </div>
    </div>
  );
} 