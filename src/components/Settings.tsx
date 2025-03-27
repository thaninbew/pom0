import React, { useState, ChangeEvent } from 'react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { TimerSettings } from '../lib/types';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface SettingsProps {
  onBack: () => void;
  settings: TimerSettings;
  onUpdateSettings: (newSettings: TimerSettings) => void;
}

export function Settings({ onBack, settings, onUpdateSettings }: SettingsProps) {
  const [workMinutes, setWorkMinutes] = useState(Math.floor(settings.workDuration / 60));
  const [shortBreakMinutes, setShortBreakMinutes] = useState(Math.floor(settings.shortBreakDuration / 60));
  const [longBreakMinutes, setLongBreakMinutes] = useState(Math.floor(settings.longBreakDuration / 60));
  const [pomodorosUntilLongBreak, setPomodorosUntilLongBreak] = useState(settings.pomodorosUntilLongBreak);

  const handleSave = () => {
    const newSettings: TimerSettings = {
      workDuration: Math.max(1, workMinutes) * 60,
      shortBreakDuration: Math.max(1, shortBreakMinutes) * 60,
      longBreakDuration: Math.max(1, longBreakMinutes) * 60,
      pomodorosUntilLongBreak: Math.max(1, pomodorosUntilLongBreak),
    };
    
    onUpdateSettings(newSettings);
    onBack();
  };

  const handleNumberInput = (e: ChangeEvent<HTMLInputElement>, setter: (value: number) => void) => {
    const value = parseInt(e.target.value, 10);
    setter(isNaN(value) ? 1 : value);
  };

  return (
    <div className="p-6 w-full max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          aria-label="Go back to timer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Settings</h1>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="work-duration">Work Duration (minutes)</Label>
            <Input
              id="work-duration"
              type="number"
              min="1"
              value={workMinutes}
              onChange={(e) => handleNumberInput(e, setWorkMinutes)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="short-break">Short Break Duration (minutes)</Label>
            <Input
              id="short-break"
              type="number"
              min="1"
              value={shortBreakMinutes}
              onChange={(e) => handleNumberInput(e, setShortBreakMinutes)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="long-break">Long Break Duration (minutes)</Label>
            <Input
              id="long-break"
              type="number"
              min="1"
              value={longBreakMinutes}
              onChange={(e) => handleNumberInput(e, setLongBreakMinutes)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pomodoros-count">Pomodoros until Long Break</Label>
            <Input
              id="pomodoros-count"
              type="number"
              min="1"
              value={pomodorosUntilLongBreak}
              onChange={(e) => handleNumberInput(e, setPomodorosUntilLongBreak)}
            />
          </div>
        </div>
        
        <Button className="w-full" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
} 