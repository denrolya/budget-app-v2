import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { cn } from '@/lib/utils';

import type { StrategyMetrics } from '../models/types';

interface Props {
  metrics: StrategyMetrics;
  horizonMonths: number;
  fiTarget: number;
  compareMetrics?: StrategyMetrics | null;
  compareName?: string;
}

type Status = 'good' | 'warn' | 'bad' | 'neutral';

interface TileProps {
  label: string;
  tooltip: string;
  status?: Status;
  /** 0-100 for the mini-bar, undefined = no bar */
  barPct?: number;
  children: React.ReactNode;
  detail?: React.ReactNode;
  /** Secondary detail line below the value row */
  subDetail?: React.ReactNode;
  compareValue?: React.ReactNode;
}

const STATUS_BAR: Record<Status, string> = {
  good: 'bg-success',
  warn: 'bg-warning',
  bad: 'bg-destructive',
  neutral: 'bg-primary',
};

const Tile: React.FC<TileProps> = ({
  label,
  tooltip,
  status = 'neutral',
  barPct,
  children,
  detail,
  subDetail,
  compareValue,
}) => (
  <div className="flex-1 px-3 py-1.5 min-w-0 space-y-1">
    <ResponsiveTooltip
      content={<span className="text-xs text-primary-foreground">{tooltip}</span>}
      contentClassName="p-2 max-w-[240px]"
    >
      <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/30">
        {label}
      </span>
    </ResponsiveTooltip>
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span
        className={cn('text-xs font-mono tabular-nums font-semibold truncate', {
          'text-success': status === 'good',
          'text-warning': status === 'warn',
          'text-destructive': status === 'bad',
        })}
      >
        {children}
      </span>
      {detail && <span className="text-2xs text-muted-foreground/60 font-mono tabular-nums truncate">{detail}</span>}
    </div>
    {subDetail && <div className="text-2xs text-muted-foreground/60 font-mono tabular-nums truncate">{subDetail}</div>}
    {barPct != null && (
      <div className="h-0.5 bg-muted rounded-full overflow-hidden">
        <div
          style={{ width: `${Math.min(barPct, 100)}%` }}
          className={cn('h-full rounded-full transition-all', STATUS_BAR[status])}
        />
      </div>
    )}
    {compareValue != null && (
      <div className="text-2xs font-mono tabular-nums text-chart-2 truncate">{compareValue}</div>
    )}
  </div>
);

const pctStatus = (val: number, good: number, warn: number): Status => {
  if (val >= good) return 'good';
  if (val >= warn) return 'warn';
  return 'bad';
};

const StrategyPanel: React.FC<Props> = ({ metrics, horizonMonths, fiTarget, compareMetrics, compareName }) => {
  const m = metrics;
  const c = compareMetrics;
  const years = horizonMonths / 12;

  const savingsStatus = pctStatus(m.savingsRate, 20, 10);
  const bufferStatus = pctStatus(m.monthsCovered, 6, 3);
  const fiStatus = pctStatus(m.fiProgress, 75, 25);
  const shockStatus = pctStatus(m.maxExpenseShock, 25, 15);
  const incomeStatus = pctStatus(m.incomeLossTolerance, 30, 15);
  const runwayStatus = pctStatus(m.runway === null ? 999 : m.runway, 24, 12);

  const runwayLabel = m.runway != null ? `${m.runway}mo` : '∞';
  const fiEtaLabel = m.fiEta != null ? `${m.fiEta}y` : '—';

  const cmpLabel = compareName ?? 'Compare';

  return (
    <div className="chart-enter shrink-0 hidden lg:flex flex-col border-t bg-card">
      {/* Section label */}
      <div className="px-3 py-0.5 border-b border-border/50 flex items-center gap-2">
        <span className="text-3xs font-medium uppercase tracking-widest text-muted-foreground/50">Strategy</span>
        {c && <span className="text-3xs font-mono text-chart-2 ml-auto">vs {cmpLabel}</span>}
      </div>

      {/* Core KPIs row */}
      <div className="flex divide-x divide-border">
        <Tile
          barPct={Math.min(m.savingsRate, 100)}
          compareValue={c && `${Math.round(c.savingsRate)}%`}
          detail="target ≥20%"
          label="Save"
          status={savingsStatus}
          tooltip="Savings rate — what % of your income you keep after expenses. The 50/30/20 rule suggests 20% minimum. Above 30% accelerates wealth building significantly. Below 10% means you're living on the edge."
        >
          {Math.round(m.savingsRate)}%
        </Tile>
        <Tile
          barPct={Math.min((m.monthsCovered / 12) * 100, 100)}
          compareValue={c && `${Math.round(c.monthsCovered * 10) / 10}mo`}
          detail="target ≥6mo"
          label="Buffer"
          status={bufferStatus}
          tooltip="Cash buffer — how many months of expenses your current cash can cover if all income stops tomorrow. Financial advisors recommend 3-6 months as a safety net. Below 3 months is risky."
        >
          {m.monthsCovered === Infinity ? '∞' : `${Math.round(m.monthsCovered * 10) / 10}mo`}
        </Tile>
        <Tile
          compareValue={c && (c.runway != null ? `${c.runway}mo` : '∞')}
          label="Runway"
          status={runwayStatus}
          tooltip="Cash runway — how many months until your cash balance hits zero in this scenario, accounting for all income and expenses. ∞ means cash never runs out within the selected horizon. Below 12 months needs immediate attention."
        >
          {runwayLabel}
        </Tile>
        <Tile
          detail={`at ${years}y`}
          label="Net Worth"
          tooltip={`Projected total net worth (cash + investments combined) at the end of your ${years}-year horizon. This is where you'll be if nothing changes from your current scenario settings.`}
          compareValue={
            c && <MoneyValue amount={c.netWorthEoH} className="text-2xs font-mono tabular-nums text-chart-2" />
          }
        >
          <MoneyValue amount={m.netWorthEoH} className="text-xs font-mono tabular-nums font-semibold" />
        </Tile>
        <Tile
          barPct={m.fiProgress}
          compareValue={c && `${Math.round(c.fiProgress)}% · ${c.fiEta != null ? `${c.fiEta}y` : '—'}`}
          detail={`→ ${Math.round(fiTarget).toLocaleString()}`}
          label="FI"
          status={fiStatus}
          subDetail={fiEtaLabel !== '—' ? `ETA ${fiEtaLabel}` : 'ETA: beyond horizon'}
          tooltip={`Financial Independence — you need 25× your annual expenses invested to live off 4% withdrawals indefinitely (the "4% rule" from the Trinity Study). Currently at ${Math.round(m.fiProgress)}%. Target: ${Math.round(fiTarget).toLocaleString()}. ${fiEtaLabel !== '—' ? `At current pace, you'll reach FI in ~${fiEtaLabel}.` : 'Not reachable within current horizon — try longer timeframes or higher savings rate.'}`}
        >
          {Math.round(m.fiProgress)}%
        </Tile>
        <Tile
          compareValue={c && `${Math.round(c.investmentYield)}%`}
          label="Yield"
          tooltip={
            "Investment yield — how much your portfolio grew purely from compound returns (excluding your contributions). Early on this will be low because compounding needs time. Over 10-20 years, compound growth should dwarf your contributions — that's when money truly works for you."
          }
        >
          {Math.round(m.investmentYield)}%
        </Tile>
      </div>

      {/* Stress tests row */}
      <div className="flex divide-x divide-border border-t border-border/50">
        <Tile
          barPct={Math.min(m.maxExpenseShock, 100)}
          compareValue={c && `+${c.maxExpenseShock}%`}
          detail="target ≥25%"
          label="Expense Shock"
          status={shockStatus}
          tooltip="Expense shock tolerance — how much your monthly expenses could suddenly increase (%) before your cash runway drops below 6 months. Think: rent hike, medical bill, car repair. ≥25% means you can absorb a significant cost spike. Below 15% means you're fragile."
        >
          +{m.maxExpenseShock}%
        </Tile>
        <Tile
          barPct={Math.min(m.incomeLossTolerance, 100)}
          compareValue={c && `−${c.incomeLossTolerance}%`}
          detail="target ≥30%"
          label="Income Loss"
          status={incomeStatus}
          tooltip="Income loss tolerance — how much your income could drop (%) before cash runway falls below 6 months. Simulates: job loss, reduced hours, client churn. ≥30% means you could survive a major income hit. Below 15% means even a small disruption is dangerous."
        >
          −{m.incomeLossTolerance}%
        </Tile>
        <Tile
          label="Inflation Cost"
          tooltip={`Inflation drag — the total extra cost of living over ${years}y assuming ~3% annual inflation. Your monthly expenses aren't fixed — they grow every year. Over ${years} years, inflation adds this much to your total spending vs. if prices stayed flat. This is already factored into the projections.`}
        >
          <MoneyValue amount={m.inflationDrag} className="text-xs font-mono tabular-nums font-semibold text-warning" />
        </Tile>
        <Tile
          label="Contributions"
          tooltip={`Total investment contributions — the sum of money you'll move from cash to investments over the ${years}-year horizon, based on your savings rate × monthly surplus. This is the fuel that powers compound growth.`}
          compareValue={
            c && <MoneyValue amount={c.totalContributions} className="text-2xs font-mono tabular-nums text-chart-2" />
          }
        >
          <MoneyValue amount={m.totalContributions} className="text-xs font-mono tabular-nums font-semibold" />
        </Tile>
      </div>
    </div>
  );
};

export default StrategyPanel;
