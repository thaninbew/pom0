import React, { useState, useEffect, useCallback, useRef } from "react";
import { TerminalSettings } from "./components/TerminalSettings";
import { TerminalUI } from "./components/TerminalUI";
import { TerminalPopout } from "./components/TerminalPopout";
import { TimerWrapper } from "./components/TimerWrapper";
import { DEFAULT_SETTINGS, TimerSettings } from "./lib/types";
import "./App.css";
import "./components/Terminal.css";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isPopoutActive, setIsPopoutActive] = useState(false);
  const [showHotkey, setShowHotkey] = useState(true);
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);

  // Refs to store callback functions from TimerWrapper
  const toggleTimerRef = useRef<(() => void) | null>(null);
  const skipSessionRef = useRef<(() => void) | null>(null);
  const timerRunningRef = useRef<boolean>(false);

  const isPopoutMode = window.location.search.includes("mode=popout");

  // Window management handler functions
  const handleSettingsClick = useCallback(
    (isRunning: boolean, toggleTimer: () => void) => {
      if (isRunning) {
        toggleTimer();
      }
      setShowSettings(true);
    },
    [],
  );

  const handleBackFromSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleUpdateSettings = useCallback((newSettings: TimerSettings) => {
    console.log("Updating settings:", newSettings);
    window.timerAPI?.timer.updateSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const handlePopout = useCallback(() => {
    console.log("App: Creating popout window");
    window.timerAPI?.window.createPopout();
  }, []);

  const handleClosePopout = useCallback(() => {
    console.log("App: Closing popout window");
    window.timerAPI?.window.closePopout();
  }, []);

  const handleQuit = useCallback(() => {
    console.log("App: Quitting app");
    window.timerAPI?.window.quit();
  }, []);

  useEffect(() => {
    console.log("App: Initializing, mode:", isPopoutMode ? "popout" : "normal");
  }, [isPopoutMode]);

  // Set up popout status listener
  useEffect(() => {
    if (window.timerAPI && !isPopoutMode) {
      window.timerAPI.window.onPopoutStatus((status) => {
        console.log("App: Received popout status", status);
        setIsPopoutActive(status);
      });

      window.timerAPI.window.onPopoutClosed(() => {
        console.log("App: Received popout closed event");
        setIsPopoutActive(false);
      });
    }
  }, [isPopoutMode]);

  // Hide hotkey message after 10 seconds
  useEffect(() => {
    const hotKeyTimer = setTimeout(() => {
      setShowHotkey(false);
    }, 10000);

    return () => clearTimeout(hotKeyTimer);
  }, []);

  // Handle keyboard shortcuts for timer controls and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings) return;

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
            toggleTimerRef.current();
          }
          break;
        case "s":
          e.preventDefault();
          e.stopPropagation();
          if (skipSessionRef.current) {
            skipSessionRef.current();
          }
          break;
        case "e":
          e.preventDefault();
          e.stopPropagation();
          if (toggleTimerRef.current && timerRunningRef.current) {
            toggleTimerRef.current();
          }
          setShowSettings(true);
          break;
        case "p":
          e.preventDefault();
          e.stopPropagation();
          if (isPopoutActive) {
            handleClosePopout();
          } else {
            handlePopout();
          }
          break;
        case "q":
          e.preventDefault();
          e.stopPropagation();
          handleQuit();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showSettings,
    lastKeyTime,
    isPopoutActive,
    handlePopout,
    handleClosePopout,
    handleQuit,
  ]);

  if (isPopoutMode) {
    return <TerminalPopout />;
  }

  return (
    <TimerWrapper>
      {(timerState, { toggleTimer, skipSession }) => {
        // Store the current callbacks in refs so they can be used in the keyboard handler
        toggleTimerRef.current = toggleTimer;
        skipSessionRef.current = skipSession;
        timerRunningRef.current = timerState.isRunning;

        return (
          <div className="h-screen w-full flex items-center justify-center bg-black">
            {showSettings ? (
              <TerminalSettings
                onBack={handleBackFromSettings}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {!isPopoutActive ? (
                  <>
                    <TerminalUI
                      state={timerState}
                      onToggleTimer={toggleTimer}
                      onSkipSession={skipSession}
                      onSettings={() =>
                        handleSettingsClick(timerState.isRunning, toggleTimer)
                      }
                      onPopout={handlePopout}
                      onQuit={handleQuit}
                      showHotkey={showHotkey}
                    />
                    {/* Show a tooltip about the global shortcut on launch */}
                    {showHotkey && (
                      <div className="fixed bottom-4 right-4 text-green-400 text-sm font-mono">
                        Press Ctrl+Shift+0 anytime to activate pom0
                      </div>
                    )}
                  </>
                ) : (
                  <div className="terminal-container">
                    <pre className="terminal">
                      {`┌──────────────────────────────────────────────┐
│ pom0@v1.0           [Ctrl+Shift+0][ACTIVE]   │
│──────────────────────────────────────────────│
│                                              │
│ Timer is currently in a floating window      │
│                                              │
${showHotkey ? "│ Press Ctrl+Shift+0 anytime to activate pom0    │\n" : ""}│ [p]opin←float                   [q]uit        │
└──────────────────────────────────────────────┘`}
                    </pre>
                    <div className="terminal-controls">
                      <div className="terminal-grid">
                        <button
                          onClick={handleClosePopout}
                          className="terminal-btn popin-btn"
                          aria-label="Close Popout"
                        >
                          Popin←Float (p)
                        </button>
                        <button
                          onClick={handleQuit}
                          className="terminal-btn quit-btn"
                          aria-label="Quit"
                        >
                          Quit (q)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }}
    </TimerWrapper>
  );
}

export default App;
