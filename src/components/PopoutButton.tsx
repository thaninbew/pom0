import React from 'react';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';

interface PopoutButtonProps {
  onClick: () => void;
  isPopoutActive: boolean;
}

export function PopoutButton({ onClick, isPopoutActive }: PopoutButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={onClick}
      aria-label={isPopoutActive ? "Popout already active" : "Open in popout window"}
      className="absolute top-4 left-4"
      disabled={isPopoutActive}
    >
      <ExternalLink className="w-5 h-5" />
    </Button>
  );
} 