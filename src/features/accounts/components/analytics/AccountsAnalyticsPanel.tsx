import React from 'react';

import AccountsTreemap from './AccountsTreemap';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  onNavigate?: (accountId: number) => void;
}

// ── Panel Card ────────────────────────────────────────────────────────────────

const PanelCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ title, subtitle, children, className = '', style }) => (
  <div
    style={style}
    className={`flex flex-col min-h-0 rounded-xl border bg-card shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out [animation-fill-mode:both] ${className}`}
  >
    <div className="flex-none px-3 pt-2.5 pb-1 border-b border-border/60">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">
        {title}
      </p>
      {subtitle && (
        <p className="text-[9px] text-muted-foreground/70 mt-0.5 leading-none">{subtitle}</p>
      )}
    </div>
    <div className="flex-1 min-h-0 p-1">{children}</div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const AccountsAnalyticsPanel: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="h-full w-full overflow-hidden p-2 grid gap-2 grid-cols-2">
      <PanelCard
        title="Portfolio"
        subtitle="by account type"
        style={{ animationDelay: '60ms' }}
      >
        <AccountsTreemap groupBy="type" onNavigate={onNavigate} />
      </PanelCard>

      <PanelCard
        title="Portfolio"
        subtitle="by currency"
        style={{ animationDelay: '120ms' }}
      >
        <AccountsTreemap groupBy="currency" />
      </PanelCard>
    </div>
  );
};

export default React.memo(AccountsAnalyticsPanel);
