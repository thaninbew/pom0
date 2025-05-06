import React, { useState, useEffect } from "react";
import { TimerMode } from "../lib/types";
import { cn } from "../lib/utils";
import { TimerWrapper } from "./TimerWrapper";

export function PopoutTimer() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (window.timerAPI) {
      setIsConnected(true);
    } else {
      console.log("PopoutTimer: timerAPI not available");
      setIsConnected(false);
    }

    return () => {
      console.log("PopoutTimer: Component unmounting");
    };
  }, []);

  return (
    <TimerWrapper>
      {(timerState, { toggleTimer, skipSession }) => (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="draggable w-full h-full p-4 flex flex-col items-center justify-center">
            {!isConnected && (
              <div className="text-red-500 mb-4 font-medium">
                Not connected to main process
              </div>
            )}

            <div
              className={cn(
                "text-7xl font-bold mb-2",
                timerState.mode === TimerMode.WORK
                  ? "text-slate-800 dark:text-slate-100"
                  : timerState.mode === TimerMode.SHORT_BREAK
                    ? "text-green-600 dark:text-green-400"
                    : "text-blue-600 dark:text-blue-400",
              )}
            >
              {formatTime(timerState.timeRemaining)}
            </div>

            <div className="mt-1 mb-4 text-sm text-slate-500 dark:text-slate-400">
              Completed: {timerState.completedPomodoros}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={toggleTimer}
                className={cn(
                  "px-5 py-2 rounded-md text-sm font-medium non-draggable",
                  "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
                  "dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90",
                )}
              >
                {timerState.isRunning ? "Pause" : "Start"}
              </button>

              <button
                onClick={skipSession}
                className={cn(
                  "px-5 py-2 rounded-md text-sm font-medium non-draggable",
                  "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
                  "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
                )}
              >
                Skip
              </button>
            </div>

            <div className="mt-4 text-slate-600 dark:text-slate-300">
              {timerState.mode === TimerMode.WORK
                ? "Focus Time"
                : timerState.mode === TimerMode.SHORT_BREAK
                  ? "Short Break"
                  : "Long Break"}
            </div>
          </div>
        </div>
      )}
    </TimerWrapper>
  );
}

// Helper function to format time as mm:ss
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}
