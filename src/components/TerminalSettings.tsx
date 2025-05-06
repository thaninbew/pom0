import React, { useState, useEffect, useCallback } from 'react';
import { TimerSettings } from '../lib/types';

interface TerminalSettingsProps {
  onBack: () => void;
  settings: TimerSettings;
  onUpdateSettings: (newSettings: TimerSettings) => void;
}

export function TerminalSettings({ onBack, settings, onUpdateSettings }: TerminalSettingsProps) {
  const [workMinutes, setWorkMinutes] = useState(Math.floor(settings.workDuration / 60));
  const [shortBreakMinutes, setShortBreakMinutes] = useState(Math.floor(settings.shortBreakDuration / 60));
  const [longBreakMinutes, setLongBreakMinutes] = useState(Math.floor(settings.longBreakDuration / 60));
  const [pomodorosUntilLongBreak, setPomodorosUntilLongBreak] = useState(settings.pomodorosUntilLongBreak);
  const [selectedField, setSelectedField] = useState<number>(0);
  
  // For terminal-style input handling
  const fields = [
    { name: 'Focus Duration', value: workMinutes, setValue: setWorkMinutes, min: 1, max: 60 },
    { name: 'Short Break', value: shortBreakMinutes, setValue: setShortBreakMinutes, min: 1, max: 30 },
    { name: 'Long Break', value: longBreakMinutes, setValue: setLongBreakMinutes, min: 1, max: 60 },
    { name: 'Pomodoros until Long Break', value: pomodorosUntilLongBreak, setValue: setPomodorosUntilLongBreak, min: 1, max: 10 },
  ];

  const handleSave = useCallback(() => {
    const newSettings: TimerSettings = {
      workDuration: Math.max(1, workMinutes) * 60,
      shortBreakDuration: Math.max(1, shortBreakMinutes) * 60,
      longBreakDuration: Math.max(1, longBreakMinutes) * 60,
      pomodorosUntilLongBreak: Math.max(1, pomodorosUntilLongBreak),
    };
    
    onUpdateSettings(newSettings);
    onBack();
  }, [workMinutes, shortBreakMinutes, longBreakMinutes, pomodorosUntilLongBreak, onUpdateSettings, onBack]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
          setSelectedField(prev => Math.max(0, prev - 1));
          break;
        case 'arrowdown':
          setSelectedField(prev => Math.min(fields.length - 1, prev + 1));
          break;
        case 'arrowleft':
          if (selectedField >= 0 && selectedField < fields.length) {
            const field = fields[selectedField];
            field.setValue(Math.max(field.min, field.value - 1));
          }
          break;
        case 'arrowright':
          if (selectedField >= 0 && selectedField < fields.length) {
            const field = fields[selectedField];
            field.setValue(Math.min(field.max, field.value + 1));
          }
          break;
        case 'enter':
          handleSave();
          break;
        case 'escape':
          onBack();
          break;
        case 'b':
          onBack();
          break;
        case 's':
          handleSave();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedField, 
    fields, 
    onBack,
    handleSave
  ]);

  // Generate field display with cursor highlighting the selected field
  const generateFieldDisplay = (index: number, name: string, value: number) => {
    const isSelected = index === selectedField;
    const cursor = isSelected ? '>' : ' ';
    const valueStr = String(value).padStart(2, ' ');
    const fieldText = `${cursor} ${name.padEnd(30, ' ')} ${valueStr} ${isSelected ? '◀▶' : '  '}`;
    return fieldText;
  };

  return (
    <div className="terminal-container">
      <pre className="terminal">
{`┌──────────────────────────────────────────────┐
│ pom0@v1.0 - Settings                         │
│──────────────────────────────────────────────│
│                                              │
${fields.map((field, index) => 
  `│ ${generateFieldDisplay(index, field.name, field.value)} │\n`
).join('')}│                                              │
│                                              │
│ Navigation: Arrow keys to select/change      │
│ [s]ave settings   [b]ack to timer            │
└──────────────────────────────────────────────┘`}
      </pre>

      {/* Invisible buttons for accessibility */}
      <div className="terminal-controls">
        <div className="terminal-grid">
          <button 
            onClick={handleSave}
            className="terminal-btn save-btn"
            aria-label="Save Settings"
          >
            Save (s)
          </button>
          <button 
            onClick={onBack}
            className="terminal-btn back-btn"
            aria-label="Back"
          >
            Back (b)
          </button>
        </div>
      </div>
    </div>
  );
} 