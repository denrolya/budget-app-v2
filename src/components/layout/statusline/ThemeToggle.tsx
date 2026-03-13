import { Bike, Check, Laptop, Moon, Sun } from 'lucide-react';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Theme, useTheme } from '@/contexts/theme';

// ── Config ────────────────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: Theme.TronDark, label: 'Tron Dark', Icon: Bike },
  { value: Theme.Light, label: 'Light', Icon: Sun },
  { value: Theme.Dark, label: 'Dark', Icon: Moon },
  { value: Theme.System, label: 'System', Icon: Laptop },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2];
  const CurrentIcon = current.Icon;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Theme"
              type="button"
              className="h-full px-2.5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-r border-border/60"
            >
              <CurrentIcon className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-mono text-xs">
          Theme
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" side="top" sideOffset={4} className="min-w-36">
        {THEME_OPTIONS.map(({ value, label, Icon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            <Icon className="mr-2 h-4 w-4" />
            <span>{label}</span>
            {theme === value && <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
