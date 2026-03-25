import React from 'react';

import { cn } from '@/lib/utils';

/**
 * Terminal-style key/value row. Label is fixed-width monospace uppercase,
 * value slot is the right-hand side content.
 */
export const DataRow: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => (
  <div className={cn('flex items-start gap-3 py-0.5', className)}>
    <span className="w-20 shrink-0 font-mono text-3xs uppercase tracking-widest text-muted-foreground leading-5 select-none">
      {label}
    </span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

/**
 * Section divider with an optional label, terminal-style dashed rule.
 */
export const SectionDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-2 my-3">
    <span className="font-mono text-3xs uppercase tracking-widest text-muted-foreground/50 select-none whitespace-nowrap">
      {label ?? ''}
    </span>
    <div className="flex-1 border-t border-dashed border-border/40" />
  </div>
);
