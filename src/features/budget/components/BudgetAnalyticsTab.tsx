import React from 'react';

import { DistributionDonutCard } from '@/features/statistics';
import MoneyFlowCard from '@/features/statistics/components/MoneyFlow/Card';
import { cn } from '@/lib/utils';
import type { ConvertedValues } from '@/features/transactions';

import type { BudgetAnalyticsItem, BudgetDTO } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';
import BudgetAccountDistribution from './BudgetAccountDistribution';
import BudgetDistributionChart from './BudgetDistributionChart';
import BudgetHeatmapSection from './BudgetHeatmapSection';

// ── Panel shell ───────────────────────────────────────────────────────────────

interface PanelProps {
  label: string;
  noLabel?: boolean;
  className?: string;
  contentClassName?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ children, className, contentClassName, label, noLabel, style }) => (
  <div className={cn('bg-card flex flex-col min-h-0 overflow-hidden panel-enter', className)} style={style}>
    {!noLabel && (
      <div className="px-3 py-0.5 border-b shrink-0">
        <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
    )}
    <div className={cn('flex-1 min-h-0 overflow-hidden', contentClassName)}>{children}</div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const BudgetAnalyticsTab: React.FC<Props> = ({ analytics, budget, displayCurrency, rates }) => (
  <div className="h-full grid grid-cols-6 grid-rows-3 gap-px bg-border">
    {/* Row 1 — Cash Flow (2/3) | Heatmap (1/3) */}
    <Panel
      noLabel
      className="col-span-4"
      contentClassName="overflow-hidden"
      label="Cash Flow"
      style={{ animationDelay: '0ms' }}
    >
      <MoneyFlowCard className="h-full min-h-0 border-0 rounded-none shadow-none" />
    </Panel>

    <Panel
      className="col-span-2"
      contentClassName="overflow-auto p-3"
      label="Spending Heatmap"
      style={{ animationDelay: '60ms' }}
    >
      <BudgetHeatmapSection analytics={analytics} budget={budget} displayCurrency={displayCurrency} rates={rates} />
    </Panel>

    {/* Row 2 — Expense Breakdown (2/3) | Distribution spans rows 2–3 (1/3) */}
    <Panel
      className="col-span-4"
      contentClassName="overflow-auto p-3"
      label="Expense Breakdown"
      style={{ animationDelay: '120ms' }}
    >
      <BudgetDistributionChart analytics={analytics} budget={budget} displayCurrency={displayCurrency} rates={rates} />
    </Panel>

    <Panel
      className="col-span-2 row-span-2"
      contentClassName="overflow-hidden p-0"
      label="Distribution"
      style={{ animationDelay: '180ms' }}
    >
      <DistributionDonutCard className="h-full min-h-0 border-0 rounded-none shadow-none" />
    </Panel>

    {/* Row 3 — Account Distribution (2/3) | Distribution continues */}
    <Panel
      className="col-span-4"
      contentClassName="overflow-auto p-0"
      label="Account Distribution"
      style={{ animationDelay: '240ms' }}
    >
      <BudgetAccountDistribution budget={budget} />
    </Panel>
  </div>
);

export default BudgetAnalyticsTab;
