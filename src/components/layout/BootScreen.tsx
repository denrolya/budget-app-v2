import React from 'react';

import { cn } from '@/lib/utils';
import type { InitEntry, InitStatus } from '@/hooks/useRequiredData';

interface BootScreenProps {
  entries: InitEntry[];
}

const BADGE: Record<InitStatus, string> = {
  idle: '[    ]',
  loading: '[ ·· ]',
  success: '[ OK ]',
  error: '[ !! ]',
};

const BADGE_CLASS: Record<InitStatus, string> = {
  idle: 'text-muted-foreground',
  loading: 'text-primary animate-pulse',
  success: 'text-success',
  error: 'text-destructive',
};

interface BootLineProps {
  entry: InitEntry;
}

const BootLine: React.FC<BootLineProps> = ({ entry }) => {
  const badge = BADGE[entry.status];
  const badgeClass = BADGE_CLASS[entry.status];
  const isActive = entry.status === 'loading' || entry.status === 'success';

  return (
    <div className="flex items-center gap-4 font-mono text-xs">
      <span className={cn('shrink-0 tabular-nums', badgeClass)}>{badge}</span>
      <span className={cn('w-36 shrink-0', { 'text-foreground': isActive, 'text-muted-foreground': !isActive })}>
        {entry.label}
      </span>
      <span className="text-muted-foreground">{entry.detail ?? '—'}</span>
    </div>
  );
};

const BootScreen: React.FC<BootScreenProps> = ({ entries }) => (
  <div className="fixed inset-0 bg-background flex flex-col justify-center px-12">
    <div className="max-w-xs">
      <p className="text-2xs font-mono uppercase tracking-widest text-muted-foreground mb-5">system init</p>
      <div className="space-y-2">
        {entries.map((entry) => (
          <BootLine entry={entry} key={entry.key} />
        ))}
      </div>
    </div>
  </div>
);

export default BootScreen;
