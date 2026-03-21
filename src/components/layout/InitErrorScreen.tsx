import React from 'react';

import { cn } from '@/lib/utils';
import type { InitEntry, InitStatus } from '@/hooks/useRequiredData';
import { Button } from '@/components/ui/button';

interface InitErrorScreenProps {
  entries: InitEntry[];
  onRetry: (key?: InitEntry['key']) => void;
}

const BADGE: Record<InitStatus, string> = {
  idle: '[ -- ]',
  loading: '[ ·· ]',
  success: '[ OK ]',
  error: '[ !! ]',
};

const BADGE_CLASS: Record<InitStatus, string> = {
  idle: 'text-muted-foreground',
  loading: 'text-primary',
  success: 'text-success',
  error: 'text-destructive',
};

const formatError = (error: Error | null): string | null => {
  if (!error) return null;
  const ax = error as { response?: { status?: number; statusText?: string } };
  if (ax.response?.status) return `→ ${ax.response.status}${ax.response.statusText ? ` ${ax.response.statusText}` : ''}`;
  return `→ ${error.message}`;
};

interface ErrorLineProps {
  entry: InitEntry;
  onRetry: (key: InitEntry['key']) => void;
}

const ErrorLine: React.FC<ErrorLineProps> = ({ entry, onRetry }) => {
  const badge = BADGE[entry.status];
  const badgeClass = BADGE_CLASS[entry.status];
  const isSkipped = entry.status === 'idle';
  const isError = entry.status === 'error';
  const errorStr = formatError(entry.error);

  return (
    <div className="flex items-start gap-4 font-mono text-xs">
      <span className={cn('shrink-0 tabular-nums mt-0.5', badgeClass)}>{badge}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className={cn('w-36 shrink-0', { 'text-muted-foreground': isSkipped })}>{entry.label}</span>
          {isError && errorStr && (
            <span className="text-destructive truncate">{entry.endpoint} {errorStr}</span>
          )}
          {isSkipped && <span className="text-muted-foreground">skipped</span>}
          {entry.status === 'success' && entry.detail && (
            <span className="text-muted-foreground">{entry.detail}</span>
          )}
        </div>
      </div>
      {isError && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 h-5 text-2xs px-2 font-mono"
          onClick={() => onRetry(entry.key)}
        >
          retry
        </Button>
      )}
    </div>
  );
};

const InitErrorScreen: React.FC<InitErrorScreenProps> = ({ entries, onRetry }) => {
  const failedKeys = entries.filter((e) => e.status === 'error').map((e) => e.key);

  return (
    <div className="fixed inset-0 bg-background flex flex-col justify-center px-12">
      <div className="max-w-lg">
        <p className="text-2xs font-mono uppercase tracking-widest text-destructive mb-5">init failed</p>
        <div className="space-y-2 mb-6">
          {entries.map((entry) => (
            <ErrorLine entry={entry} key={entry.key} onRetry={onRetry} />
          ))}
        </div>
        {failedKeys.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-xs h-7"
            onClick={() => onRetry()}
          >
            retry all
          </Button>
        )}
      </div>
    </div>
  );
};

export default InitErrorScreen;
