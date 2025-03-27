// TimerMode enum to represent the different states of the timer
export enum TimerMode {
  WORK = 'work',
  SHORT_BREAK = 'shortBreak',
  LONG_BREAK = 'longBreak',
}

// TimerState interface to represent the current state of the timer
export interface TimerState {
  mode: TimerMode;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  completedPomodoros: number;
  pomodorosUntilLongBreak: number;
}

// Settings interface for timer configuration
export interface TimerSettings {
  workDuration: number; // in seconds
  shortBreakDuration: number; // in seconds
  longBreakDuration: number; // in seconds
  pomodorosUntilLongBreak: number;
}

// Default settings
export const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25 * 60, // 25 minutes
  shortBreakDuration: 5 * 60, // 5 minutes
  longBreakDuration: 15 * 60, // 15 minutes
  pomodorosUntilLongBreak: 4,
}; 