import React from 'react';

import AccountsTreemap from './AccountsTreemap';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  onNavigate?: (accountId: number) => void;
}

// ── Panel Card ────────────────────────────────────────────────────────────────

const PanelCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  subtitle?: string;
  title: string;
}> = ({ children, className = '', style, subtitle, title }) => (
  <div
    style={style}
    className={`flex flex-col min-h-0 rounded-lg border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out [animation-fill-mode:both] ${className}`}
  >
    <div className="flex-none px-3 pt-2 pb-1.5 border-b border-border/50 flex items-baseline gap-2">
      <p className="text-2xs font-mono font-semibold uppercase tracking-widest text-foreground leading-none">
        {title}
      </p>
      {subtitle && (
        <p className="text-2xs font-mono text-muted-foreground/60 leading-none">{subtitle}</p>
      )}
    </div>
    <div className="flex-1 min-h-0 p-1">{children}</div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const AccountsAnalyticsPanel: React.FC<Props> = ({ onNavigate }) => (
  <div className="h-full w-full overflow-hidden p-2 grid gap-2 grid-cols-2">
    <PanelCard style={{ animationDelay: '60ms' }} subtitle="// by type" title="PORTFOLIO">
      <AccountsTreemap groupBy="type" onNavigate={onNavigate} />
    </PanelCard>

    <PanelCard style={{ animationDelay: '140ms' }} subtitle="// by currency" title="PORTFOLIO">
      <AccountsTreemap groupBy="currency" />
    </PanelCard>
  </div>
);

export default React.memo(AccountsAnalyticsPanel);
