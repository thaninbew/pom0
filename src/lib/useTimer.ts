import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode, TimerState, TimerSettings, DEFAULT_SETTINGS } from './types';

export function useTimer(settings: TimerSettings = DEFAULT_SETTINGS) {
  const [state, setState] = useState<TimerState>({
    mode: TimerMode.WORK,
    timeRemaining: settings.workDuration,
    isRunning: false,
    completedPomodoros: 0,
    pomodorosUntilLongBreak: settings.pomodorosUntilLongBreak,
  });
  
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTransitioning = useRef<boolean>(false);

  const getTimeForMode = useCallback((mode: TimerMode): number => {
    switch (mode) {
      case TimerMode.WORK:
        return settings.workDuration;
      case TimerMode.SHORT_BREAK:
        return settings.shortBreakDuration;
      case TimerMode.LONG_BREAK:
        return settings.longBreakDuration;
      default:
        return settings.workDuration;
    }
  }, [settings]);

  const handleSessionComplete = useCallback((currentState: TimerState, settings: TimerSettings): TimerState => {
    try {
      console.log('Session completed! Current mode:', currentState.mode);
      
      if (currentState.mode === TimerMode.WORK) {
        const completedPomodoros = currentState.completedPomodoros + 1;
        console.log('Completed pomodoros incremented to:', completedPomodoros);
        
        const isLongBreakDue = completedPomodoros % settings.pomodorosUntilLongBreak === 0;
        
        if (isLongBreakDue) {
          console.log('Starting long break');
          return {
            ...currentState,
            mode: TimerMode.LONG_BREAK,
            timeRemaining: settings.longBreakDuration,
            completedPomodoros,
          };
        } else {
          console.log('Starting short break');
          return {
            ...currentState,
            mode: TimerMode.SHORT_BREAK,
            timeRemaining: settings.shortBreakDuration,
            completedPomodoros,
          };
        }
      } else {
        console.log('Break completed, starting work session');
        return {
          ...currentState,
          mode: TimerMode.WORK,
          timeRemaining: settings.workDuration,
        };
      }
    } catch (error) {
      console.error('Error during session transition:', error);
      return {
        ...currentState,
        mode: TimerMode.WORK,
        timeRemaining: settings.workDuration,
      };
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Timer stopped');
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    
    console.log('Starting timer with speed multiplier:', speedMultiplier);
    
    intervalRef.current = setInterval(() => {
      setState((prevState) => {
        if (isTransitioning.current) {
          return prevState;
        }
        
        const timeToDecrease = speedMultiplier;
        const newTimeRemaining = Math.max(0, prevState.timeRemaining - timeToDecrease);
        
        if (newTimeRemaining === 0 && prevState.timeRemaining > 0) {
          console.log('Timer reached zero');
          
          isTransitioning.current = true;
          
          setTimeout(() => {
            setState((currentState) => {
              const newState = handleSessionComplete(currentState, settings);
              console.log('Transitioning to new state:', newState.mode);
              
              isTransitioning.current = false;
              
              return newState;
            });
          }, 100);
        }
        
        return {
          ...prevState,
          timeRemaining: newTimeRemaining
        };
      });
    }, 1000 / speedMultiplier);
  }, [settings, handleSessionComplete, speedMultiplier, stopTimer]);

  const toggleTimer = useCallback(() => {
    setState(prevState => {
      const newIsRunning = !prevState.isRunning;
      
      console.log('Toggle timer:', newIsRunning ? 'starting' : 'stopping');
      
      if (newIsRunning) {
        if (prevState.timeRemaining <= 0) {
          const newTimeRemaining = getTimeForMode(prevState.mode);
          console.log('Resetting time to', newTimeRemaining);
          
          setTimeout(() => startTimer(), 0);
          
          return {
            ...prevState,
            isRunning: true,
            timeRemaining: newTimeRemaining
          };
        }
        
        startTimer();
      } else {
        stopTimer();
      }
      
      return {
        ...prevState,
        isRunning: newIsRunning
      };
    });
  }, [startTimer, stopTimer, getTimeForMode]);

  const skipSession = useCallback(() => {
    if (isTransitioning.current) {
      console.log('Skip blocked - already transitioning');
      return;
    }
    
    console.log('Skipping to next session');
    isTransitioning.current = true;
    
    setState(prevState => {
      const wasRunning = prevState.isRunning;
      
      if (wasRunning) {
        stopTimer();
      }
      
      const nextState = handleSessionComplete(prevState, settings);
      
      isTransitioning.current = false;
      
      if (wasRunning) {
        setTimeout(() => startTimer(), 0);
      }
      
      return {
        ...nextState,
        isRunning: wasRunning
      };
    });
  }, [settings, startTimer, stopTimer, handleSessionComplete]);

  const toggleSpeedMode = useCallback(() => {
    setSpeedMultiplier(prevSpeed => {
      const newSpeed = prevSpeed === 1 ? 60 : 1;
      console.log('Changing speed multiplier to:', newSpeed);
      
      if (state.isRunning) {
        stopTimer();
        setTimeout(() => startTimer(), 0);
      }
      
      return newSpeed;
    });
  }, [state.isRunning, startTimer, stopTimer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!state.isRunning) return;
      
      if (document.visibilityState === 'visible') {
        console.log('Page visible, resuming timer');
        startTimer();
      } else {
        console.log('Page hidden, pausing timer');
        stopTimer();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isRunning, startTimer, stopTimer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('Settings updated');
    setState(prevState => {
      if (!prevState.isRunning) {
        return {
          ...prevState,
          timeRemaining: getTimeForMode(prevState.mode),
          pomodorosUntilLongBreak: settings.pomodorosUntilLongBreak,
        };
      }
      return {
        ...prevState,
        pomodorosUntilLongBreak: settings.pomodorosUntilLongBreak,
      };
    });
  }, [settings, getTimeForMode]);

  return {
    state,
    toggleTimer,
    skipSession,
    speedMultiplier,
    toggleSpeedMode,
  };
} 