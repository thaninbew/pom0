import React, { useState, useEffect } from 'react';
import { TimerState } from '../lib/types';
import { asciiPets, getRandomMessage, formatTime, getStatusText } from '../lib/asciiPet';

interface TerminalUIProps {
  state: TimerState;
  onToggleTimer: () => void;
  onSkipSession: () => void;
  onSettings: () => void;
  onPopout: () => void;
  onQuit: () => void;
}

export function TerminalUI({
  state,
  onToggleTimer,
  onSkipSession,
  onSettings,
  onPopout,
  onQuit,
}: TerminalUIProps) {
  const [message, setMessage] = useState<string>('');
  
  // Update message when timer mode changes or timer starts/stops
  useEffect(() => {
    setMessage(getRandomMessage(state.mode));
  }, [state.mode, state.isRunning]);

  // Update message periodically when timer is running
  useEffect(() => {
    if (!state.isRunning) return;
    
    const interval = setInterval(() => {
      // 20% chance to update message every 10 seconds
      if (Math.random() < 0.2) {
        setMessage(getRandomMessage(state.mode));
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [state.isRunning, state.mode]);

  // Format the pet display
  const petDisplay = asciiPets[state.mode]
    .replace('{TIME}', formatTime(state.timeRemaining))
    .replace('{STATUS}', getStatusText(state.mode))
    .replace('{COMPLETED}', state.completedPomodoros.toString());

  const handleFreeze = () => {
    onToggleTimer();
  };

  const handleSkip = () => {
    onSkipSession();
  };

  return (
    <div className="terminal-container">
      <pre className="terminal">
{`┌──────────────────────────────────────────────┐
│ pom0@v1.0                                    │
│──────────────────────────────────────────────│
${petDisplay}
│                                              │
│ ascii-pet says: "${message}"                 │
│                                              │
│ [f]${state.isRunning ? 'reeze' : 'ocus'}  [s]kip  [p]opout  s[e]ttings  [q]uit │
└──────────────────────────────────────────────┘`}
      </pre>
      
      {/* Invisible buttons for keyboard shortcuts - positioned in a grid */}
      <div className="terminal-controls">
        <div className="terminal-grid">
          <button 
            onClick={handleFreeze}
            className="terminal-btn freeze-btn"
            aria-label={state.isRunning ? "Freeze" : "Focus"}
          >
            {state.isRunning ? "Freeze" : "Focus"} (f)
          </button>
          
          <button 
            onClick={handleSkip}
            className="terminal-btn skip-btn"
            aria-label="Skip"
          >
            Skip (s)
          </button>
          
          <button 
            onClick={onPopout}
            className="terminal-btn popout-btn"
            aria-label="Popout"
          >
            Popout (p)
          </button>
          
          <button 
            onClick={onSettings}
            className="terminal-btn settings-btn"
            aria-label="Settings"
          >
            Settings (e)
          </button>
          
          <button 
            onClick={onQuit}
            className="terminal-btn quit-btn"
            aria-label="Quit"
          >
            Quit (q)
          </button>
        </div>
      </div>
    </div>
  );
} 