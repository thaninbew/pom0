import React, { useState, useEffect } from 'react';
import { TimerState, TimerMode } from '../lib/types';
import { asciiPets, getRandomMessage, formatTime, getStatusText } from '../lib/asciiPet';

export function TerminalPopout() {
  const [message, setMessage] = useState<string>('');
  const [timerState, setTimerState] = useState<TimerState>({
    mode: TimerMode.WORK,
    timeRemaining: 25 * 60, 
    isRunning: false,
    completedPomodoros: 0,
    pomodorosUntilLongBreak: 4,
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [showHotkey, setShowHotkey] = useState(true);

  useEffect(() => {
    console.log("TerminalPopout: Component mounted");
    
    if (window.electronAPI) {
      console.log("TerminalPopout: Requesting timer state");
      window.electronAPI.sendMessage('request-timer-state');
      setIsConnected(true);
      
      // Focus the window to ensure it can receive keyboard events
      window.electronAPI.sendMessage('activate-window');
    } else {
      console.log("TerminalPopout: electronAPI not available");
      setIsConnected(false);
    }

    window.electronAPI?.receive('timer-state-update', (data: unknown) => {
      console.log("TerminalPopout: Received timer state update", data);
      if (data && typeof data === 'object' && 'mode' in data && 'timeRemaining' in data) {
        setTimerState(data as TimerState);
      }
    });

    // Hide the hotkey message after 10 seconds
    const hotKeyTimer = setTimeout(() => {
      setShowHotkey(false);
    }, 10000);

    return () => {
      console.log("TerminalPopout: Component unmounting");
      window.electronAPI?.sendMessage('popout-unmounting');
      clearTimeout(hotKeyTimer);
    };
  }, []);

  // Update message when timer state changes
  useEffect(() => {
    setMessage(getRandomMessage(timerState.mode));
  }, [timerState.mode, timerState.isRunning]);

  // Handle keyboard events for this window
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isConnected) return;
      
      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          e.stopPropagation();
          handleFreeze();
          break;
        case 's':
          e.preventDefault();
          e.stopPropagation();
          handleSkip();
          break;
        case 'p':
          e.preventDefault();
          e.stopPropagation();
          handlePopIn();
          break;
        case 'q':
          e.preventDefault();
          e.stopPropagation();
          handleQuit();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState, isConnected]);

  // Format the pet display
  const petDisplay = asciiPets[timerState.mode]
    .replace('{TIME}', formatTime(timerState.timeRemaining))
    .replace('{STATUS}', getStatusText(timerState.mode))
    .replace('{COMPLETED}', timerState.completedPomodoros.toString());

  const handleFreeze = () => {
    console.log("TerminalPopout: Toggle timer clicked");
    window.electronAPI?.sendMessage('toggle-timer');
  };

  const handleSkip = () => {
    console.log("TerminalPopout: Skip session clicked");
    window.electronAPI?.sendMessage('skip-session');
  };

  const handlePopIn = () => {
    console.log("TerminalPopout: Popin clicked");
    window.electronAPI?.sendMessage('close-popout');
  };

  const handleQuit = () => {
    console.log("TerminalPopout: Quit clicked");
    window.electronAPI?.sendMessage('quit-app');
  };

  return (
    <div className="terminal-container draggable h-screen w-full flex items-center justify-center bg-black">
      <pre className="terminal non-draggable">
{`┌──────────────────────────────────────────────┐
${!isConnected ? '│ Not connected to main window                 │\n' : ''}│ pom0@v1.0           [Ctrl+Shift+0][POPOUT]   │
│──────────────────────────────────────────────│
${petDisplay}
│                                              │
│ ascii-pet says: "${message}"                 │
${showHotkey ? '│ Use Ctrl+Shift+0 to activate this window       │\n' : ''}│                                              │
│ [f]${timerState.isRunning ? 'reeze' : 'ocus'}  [s]kip  [p]opin  [q]uit      │
└──────────────────────────────────────────────┘`}
      </pre>
      
      {/* Invisible buttons for keyboard shortcuts - positioned in a grid */}
      <div className="terminal-controls non-draggable">
        <div className="terminal-grid">
          <button 
            onClick={handleFreeze}
            className="terminal-btn freeze-btn non-draggable"
            aria-label={timerState.isRunning ? "Freeze" : "Focus"}
          >
            {timerState.isRunning ? "Freeze" : "Focus"} (f)
          </button>
          
          <button 
            onClick={handleSkip}
            className="terminal-btn skip-btn non-draggable"
            aria-label="Skip"
          >
            Skip (s)
          </button>
          
          <button 
            onClick={handlePopIn}
            className="terminal-btn popin-btn non-draggable"
            aria-label="Pop In"
          >
            Pop In (p)
          </button>
          
          <button 
            onClick={handleQuit}
            className="terminal-btn quit-btn non-draggable"
            aria-label="Quit"
          >
            Quit (q)
          </button>
        </div>
      </div>
    </div>
  );
} 