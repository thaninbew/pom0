import React, { useState, useEffect, useCallback } from "react";
import {
  asciiPets,
  getRandomMessage,
  formatTime,
  getStatusText,
} from "../lib/asciiPet";
import { TimerWrapper } from "./TimerWrapper";

export function TerminalPopout() {
  const [message, setMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [showHotkey, setShowHotkey] = useState(true);
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const [lastMode, setLastMode] = useState<string>("");

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

  // Handle keyboard events for non-timer controls
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
          <div className="terminal-container draggable h-screen w-full flex items-center justify-center bg-black">
            <pre className="terminal non-draggable">
              {`┌──────────────────────────────────────────────┐
${!isConnected ? "│ Not connected to main window                 │\n" : ""}│ pom0@v1.0           [Ctrl+Shift+0][POPOUT]   │
│──────────────────────────────────────────────│
${petDisplay}
│                                              │
│ ascii-pet says: "${message}"                 │
${showHotkey ? "│ Use Ctrl+Shift+0 to activate this window       │\n" : ""}│                                              │
│ [f]${timerState.isRunning ? "reeze" : "ocus"}  [s]kip  [p]opin→main  [q]uit      │
└──────────────────────────────────────────────┘`}
            </pre>

            {/* Invisible buttons for keyboard shortcuts - positioned in a grid */}
            <div className="terminal-controls non-draggable">
              <div className="terminal-grid">
                <button
                  onClick={toggleTimer}
                  className="terminal-btn freeze-btn non-draggable"
                  aria-label={timerState.isRunning ? "Freeze" : "Focus"}
                >
                  {timerState.isRunning ? "Freeze" : "Focus"} (f)
                </button>

                <button
                  onClick={skipSession}
                  className="terminal-btn skip-btn non-draggable"
                  aria-label="Skip"
                >
                  Skip (s)
                </button>

                <button
                  onClick={handlePopIn}
                  className="terminal-btn popin-btn non-draggable"
                  aria-label="Pop In→Main"
                >
                  Pop In→Main (p)
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
      }}
    </TimerWrapper>
  );
}
