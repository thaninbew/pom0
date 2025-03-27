import React from 'react';
import { Button } from './ui/button';
import { Zap } from 'lucide-react';

interface TimerControlsProps {
  isRunning: boolean;
  onToggle: () => void;
  onSkip: () => void;
  speedMultiplier: number;
  onToggleSpeed: () => void;
}

export function TimerControls({ 
  isRunning, 
  onToggle, 
  onSkip, 
  speedMultiplier, 
  onToggleSpeed 
}: TimerControlsProps) {
  return (
    <div className="flex flex-col space-y-4 mt-6 items-center">
      <div className="flex space-x-4">
        <Button 
          variant="default" 
          className="w-32" 
          onClick={onToggle}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button 
          variant="outline"
          className="w-32"
          onClick={onSkip}
          aria-label="Skip to next session"
        >
          Skip
        </Button>
      </div>
      
      <Button
        variant={speedMultiplier > 1 ? "destructive" : "secondary"}
        size="sm"
        onClick={onToggleSpeed}
        className="flex items-center gap-2"
        aria-label={speedMultiplier > 1 ? "Disable fast mode" : "Enable fast mode"}
      >
        <Zap className="w-4 h-4" />
        {speedMultiplier > 1 ? `${speedMultiplier}x Speed` : "Normal Speed"}
      </Button>
    </div>
  );
} 