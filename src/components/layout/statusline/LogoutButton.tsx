import { LogOut } from 'lucide-react';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth';

const LogoutButton: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (!window.confirm('Sign out?')) return;
    logout();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Log out"
          onClick={handleLogout}
          className="h-full px-2.5 inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted/50 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-xs">
        Log out
      </TooltipContent>
    </Tooltip>
  );
};

export default LogoutButton;
