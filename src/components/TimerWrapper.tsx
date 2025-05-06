import React, { useState, useEffect } from "react";
import { TimerMode, TimerState, TimerSettings } from "../lib/types";

// Define the window.timerAPI interface for TypeScript
declare global {
  interface Window {
    timerAPI?: {
      timer: {
        toggle: () => void;
        skip: () => void;
        toggleSpeed: () => void;
        requestState: () => void;
        onStateUpdate: (callback: (state: TimerState) => void) => void;
        updateSettings: (settings: TimerSettings) => void;
      };
      window: {
        createPopout: () => void;
        closePopout: () => void;
        onPopoutStatus: (callback: (status: boolean) => void) => void;
        onPopoutClosed: (callback: () => void) => void;
        activate: () => void;
        quit: () => void;
      };
      // Legacy API
      electronAPI?: {
        sendMessage: (channel: string, data?: unknown) => void;
        receive: (channel: string, func: (...args: unknown[]) => void) => void;
        receiveOnce: (
          channel: string,
          func: (...args: unknown[]) => void,
        ) => void;
      };
    };
  }
}

interface TimerWrapperProps {
  children: (
    state: TimerState,
    controls: {
      toggleTimer: () => void;
      skipSession: () => void;
      toggleSpeed: () => void;
    },
  ) => React.ReactNode;
}

export function TimerWrapper({ children }: TimerWrapperProps) {
  // Initialize with default state
  const [timerState, setTimerState] = useState<TimerState>({
    mode: TimerMode.WORK,
    timeRemaining: 25 * 60, // 25 minutes
    isRunning: false,
    completedPomodoros: 0,
    pomodorosUntilLongBreak: 4,
  });

  useEffect(() => {
    console.log("TimerWrapper: Component mounted");

    // Request initial timer state from main process
    window.timerAPI?.timer.requestState();

    // Set up listeners for timer state updates
    if (window.timerAPI) {
      window.timerAPI.timer.onStateUpdate((state) => {
        console.log("TimerWrapper: Received timer state update", state);
        setTimerState(state);
      });

      // Listen for popout window status changes
      window.timerAPI.window.onPopoutStatus((status) => {
        console.log("TimerWrapper: Received popout status", status);
      });

      window.timerAPI.window.onPopoutClosed(() => {
        console.log("TimerWrapper: Received popout closed event");
      });
    } else {
      console.log("TimerWrapper: timerAPI not available");
    }

    return () => {
      console.log("TimerWrapper: Component unmounting");
    };
  }, []);

  // Timer control functions
  const toggleTimer = () => {
    console.log("TimerWrapper: Toggle timer");
    window.timerAPI?.timer.toggle();
  };

  const skipSession = () => {
    console.log("TimerWrapper: Skip session");
    window.timerAPI?.timer.skip();
  };

  const toggleSpeed = () => {
    console.log("TimerWrapper: Toggle speed");
    window.timerAPI?.timer.toggleSpeed();
  };

  // Render children with state and control functions
  return (
    <>
      {children(timerState, {
        toggleTimer,
        skipSession,
        toggleSpeed,
      })}
    </>
  );
}
