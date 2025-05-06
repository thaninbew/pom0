import { TimerMode } from './types';

// ASCII pet states for different timer modes
export const asciiPets = {
  [TimerMode.WORK]: `
   /\\_/\\
  ( •_• )   {STATUS}: {TIME} remaining
   >🍅<     Completed: {COMPLETED}
  `,
  [TimerMode.SHORT_BREAK]: `
   /\\_/\\
  ( -.- )   {STATUS}: {TIME} remaining
   zzz      Completed: {COMPLETED}
  `,
  [TimerMode.LONG_BREAK]: `
   /\\_/\\
  ( ^ω^ )   {STATUS}: {TIME} remaining
   ~♪~      Completed: {COMPLETED}
  `,
};

// Pet messages based on timer state
export const petMessages = {
  [TimerMode.WORK]: [
    "Stay focused, human.",
    "You're doing great! Keep going.",
    "Eyes on the prize!",
    "Just a bit longer...",
    "Productivity is flowing!",
  ],
  [TimerMode.SHORT_BREAK]: [
    "Take a quick breather.",
    "Stretch those muscles!",
    "A short break is well deserved.",
    "Recharging...",
    "Almost ready for the next round!",
  ],
  [TimerMode.LONG_BREAK]: [
    "Time for a proper rest!",
    "You've earned this break.",
    "Relax and recharge.",
    "Great job completing those pomodoros!",
    "Take it easy for a bit.",
  ],
};

// Get a random message for the current mode
export function getRandomMessage(mode: TimerMode): string {
  const messages = petMessages[mode];
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// Format time as mm:ss
export function formatTime(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Get status text based on mode
export function getStatusText(mode: TimerMode): string {
  switch (mode) {
    case TimerMode.WORK:
      return "Focus";
    case TimerMode.SHORT_BREAK:
      return "Short Break";
    case TimerMode.LONG_BREAK:
      return "Long Break";
    default:
      return "Focus";
  }
} 