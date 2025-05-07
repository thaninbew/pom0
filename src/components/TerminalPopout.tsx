import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  asciiPets,
  getRandomMessage,
  formatTime,
  getStatusText,
} from "../lib/asciiPet";
import { TimerWrapper } from "./TimerWrapper";
// Import types but don't use directly as they're implied through TimerWrapper

// This component is ONLY used for the popout window mode
export function TerminalPopout() {
  const [message, setMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [showHotkey, setShowHotkey] = useState(true);
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const [lastMode, setLastMode] = useState<string>("");

  // Refs to store timer callbacks
  const toggleTimerRef = useRef<(() => void) | null>(null);
  const skipSessionRef = useRef<(() => void) | null>(null);
  
  // Ref for resize handling
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const handlePopIn = useCallback(() => {
    console.log("TerminalPopout: Popin clicked");
    window.timerAPI?.window.closePopout();
  }, []);

  const handleQuit = useCallback(() => {
    console.log("TerminalPopout: Quit clicked");
    window.timerAPI?.window.quit();
  }, []);

  useEffect(() => {
    console.log("TerminalPopout: Component mounted");

    if (window.timerAPI) {
      console.log("TerminalPopout: Connected to timer API");
      setIsConnected(true);

      // Focus the window to ensure it can receive keyboard events
      window.timerAPI.window.activate();
    } else {
      console.log("TerminalPopout: timerAPI not available");
      setIsConnected(false);
    }

    // Hide the hotkey message after 10 seconds
    const hotKeyTimer = setTimeout(() => {
      setShowHotkey(false);
    }, 10000);

    return () => {
      console.log("TerminalPopout: Component unmounting");
      clearTimeout(hotKeyTimer);
    };
  }, []);

  // Set up resize functionality
  useEffect(() => {
    if (!window.timerAPI || !resizeHandleRef.current) return;
    
    const resizeHandle = resizeHandleRef.current;
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 600; // Default width
    let startHeight = 400; // Default height
    
    const startResize = async (e: MouseEvent) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current window size using the proper API
      try {
        // The getBounds method now returns a Promise with window bounds
        if (window.timerAPI?.window.getBounds) {
          const bounds = await window.timerAPI.window.getBounds();
          if (bounds) {
            startWidth = bounds.width;
            startHeight = bounds.height;
          }
        }
      } catch (err) {
        console.log('Unable to get window bounds, using defaults', err);
      }
      
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      
      e.preventDefault();
    };
    
    const resize = (e: MouseEvent) => {
      if (!isResizing || !window.timerAPI?.window.resize) return;
      
      // Calculate new width and height
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);
      
      // Minimum size constraints
      const minWidth = 600;
      const minHeight = 300;
      
      // Use the resize method from the API
      window.timerAPI.window.resize(
        Math.max(minWidth, newWidth),
        Math.max(minHeight, newHeight)
      );
    };
    
    const stopResize = () => {
      isResizing = false;
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
    
    resizeHandle.addEventListener('mousedown', startResize);
    
    return () => {
      resizeHandle.removeEventListener('mousedown', startResize);
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [isConnected]);

  // Handle keyboard events for all controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isConnected) return;

      // Debounce keypress events with 300ms threshold
      const now = Date.now();
      if (now - lastKeyTime < 300) {
        return;
      }
      setLastKeyTime(now);

      switch (e.key.toLowerCase()) {
        case "f":
          e.preventDefault();
          e.stopPropagation();
          if (toggleTimerRef.current) {
            console.log("TerminalPopout: Toggle timer via keyboard");
            toggleTimerRef.current();
          }
          break;
        case "s":
          e.preventDefault();
          e.stopPropagation();
          if (skipSessionRef.current) {
            console.log("TerminalPopout: Skip session via keyboard");
            skipSessionRef.current();
          }
          break;
        case "p":
          e.preventDefault();
          e.stopPropagation();
          handlePopIn();
          break;
        case "q":
          e.preventDefault();
          e.stopPropagation();
          handleQuit();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConnected, lastKeyTime, handlePopIn, handleQuit]);

  return (
    <TimerWrapper>
      {(timerState, { toggleTimer, skipSession }) => {
        // Store callbacks in refs for keyboard events
        toggleTimerRef.current = toggleTimer;
        skipSessionRef.current = skipSession;

        // Update message when timer mode changes
        if (message === "" || lastMode !== timerState.mode) {
          setMessage(getRandomMessage(timerState.mode));
          setLastMode(timerState.mode);
        }

        // Format the pet display
        const petDisplay = asciiPets[timerState.mode]
          .replace("{TIME}", formatTime(timerState.timeRemaining))
          .replace("{STATUS}", getStatusText(timerState.mode))
          .replace("{COMPLETED}", timerState.completedPomodoros.toString());

        return (
          <div className="terminal-container h-screen w-full flex flex-col items-start justify-start bg-black cursor-grab active:cursor-grabbing">
            <div className="terminal-box w-auto font-mono text-terminal-green">
              {/* Header section */}
              <div className="terminal-header px-4 py-1 border-b border-terminal-green flex justify-between">
                <div>pom0@v1.0</div>
                <div>[Ctrl+Shift+0][POPOUT]</div>
              </div>
              
              {/* Not connected message (conditional) */}
              {!isConnected && (
                <div className="px-4 py-1 border-b border-terminal-green">
                  Not connected to main window
                </div>
              )}
              
              {/* Main content section - ASCII pet */}
              <div className="terminal-content px-4 py-2 whitespace-pre font-mono">
                {petDisplay}
              </div>
              
              {/* Empty line before message */}
              <div className="px-4 py-1"></div>
              
              {/* Message section */}
              <div className="terminal-message px-4 py-1">
                ascii-pet says: "{message}"
              </div>
              
              {/* Hotkey message (conditional) */}
              {showHotkey && (
                <div className="terminal-hotkey px-4 py-1">
                  Use Ctrl+Shift+0 to activate this window
                </div>
              )}
              
              {/* Empty line before footer */}
              <div className="px-4 py-1"></div>
              
              {/* Footer section with controls */}
              <div className="terminal-footer px-4 py-1 border-t border-terminal-green">
                [f]{timerState.isRunning ? "reeze" : "ocus"}  [s]kip  [p]opin→main  [q]uit
              </div>
            </div>

            {/* Invisible buttons for keyboard shortcuts - positioned in a grid */}
            <div className="terminal-controls">
              <div className="terminal-grid">
                <button
                  onClick={toggleTimer}
                  className="terminal-btn freeze-btn cursor-pointer"
                  aria-label={timerState.isRunning ? "Freeze" : "Focus"}
                >
                  {timerState.isRunning ? "Freeze" : "Focus"} (f)
                </button>

                <button
                  onClick={skipSession}
                  className="terminal-btn skip-btn cursor-pointer"
                  aria-label="Skip"
                >
                  Skip (s)
                </button>

                <button
                  onClick={handlePopIn}
                  className="terminal-btn popin-btn cursor-pointer"
                  aria-label="Pop In→Main"
                >
                  Pop In→Main (p)
                </button>

                <button
                  onClick={handleQuit}
                  className="terminal-btn quit-btn cursor-pointer"
                  aria-label="Quit"
                >
                  Quit (q)
                </button>
              </div>
            </div>
            
            {/* Resize handle in the bottom right corner */}
            <div 
              ref={resizeHandleRef}
              className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-50 hover:opacity-100"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="white"
                width="24" 
                height="24"
              >
                <path d="M22 22H16V16H22V22ZM22 2V14H16V8H10V2H22Z" />
              </svg>
            </div>
          </div>
        );
      }}
    </TimerWrapper>
  );
}
