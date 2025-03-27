import React from 'react';
import { Button } from './ui/button';
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onClick}
      aria-label="Open settings"
      className="absolute top-4 right-4"
    >
      <Settings className="w-5 h-5" />
    </Button>
  );
} 