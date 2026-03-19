import { Handshake, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type KpiStatTile, type KpiTileConfig, kpiConfig } from '@/constants/dashboard-config';
import { useIsDebtsLoading, useTotalBalance, useTotalDebt } from '@/hooks/financeData';
import { useValueByPeriod } from '@/hooks/statistics/useValueByPeriodStatistics';
import { cn } from '@/lib/utils';
import { type StatisticsConfig } from '@/types/statistics';

// ── Shared primitives ─────────────────────────────────────────────────────────

interface TileProps {
  label: string;
  isLoading: boolean;
  children: React.ReactNode;
}

const KpiTile: React.FC<TileProps> = ({ label, isLoading, children }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 flex flex-col gap-1.5">
      <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground leading-none">{label}</p>
      {isLoading ? (
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

const PctChange: React.FC<{ pct: number; positiveIsGood: boolean }> = ({ pct, positiveIsGood }) => {
  const isUp = pct >= 0;
  const isGood = positiveIsGood ? isUp : !isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-xs font-medium', {
        'text-success': isGood,
        'text-destructive': !isGood,
        'text-muted-foreground': pct === 0,
      })}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
};

// ── Tile renderers ────────────────────────────────────────────────────────────

const NetWorthTile: React.FC = () => {
  const totalBalance = useTotalBalance();
  const totalDebt = useTotalDebt();
  const isDebtsLoading = useIsDebtsLoading();
  const netWorth = totalBalance + totalDebt;

  return (
    <KpiTile isLoading={isDebtsLoading} label="Net Worth">
      <p className="text-2xl font-bold tracking-tight">
        <MoneyValue amount={netWorth} useColors={false} />
      </p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 cursor-help">
              <PiggyBank className="h-3 w-3" />
              <MoneyValue amount={totalBalance} useColors={false} className="text-xs" />
            </span>
          </TooltipTrigger>
          <TooltipContent>Cash balance</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 cursor-help">
              <Handshake className="h-3 w-3" />
              <MoneyValue amount={totalDebt} useColors={false} className="text-xs" />
            </span>
          </TooltipTrigger>
          <TooltipContent>Total debt</TooltipContent>
        </Tooltip>
      </div>
    </KpiTile>
  );
};

const StatKpiTile: React.FC<KpiStatTile> = ({ label, positiveIsGood, config, queryKey }) => {
  const stats = useValueByPeriod({ config }, [], queryKey);
  const value = stats.currentValue as number;
  const pct = stats.percentageChange as number;

  return (
    <KpiTile isLoading={stats.isLoading} label={label}>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight">
          <MoneyValue amount={value} useColors={false} />
        </p>
        <PctChange pct={pct} positiveIsGood={positiveIsGood} />
      </div>
      <p className="text-xs text-muted-foreground">vs previous month</p>
    </KpiTile>
  );
};

const NetRevenueTile: React.FC<{ incomeConfig: StatisticsConfig; expenseConfig: StatisticsConfig }> = ({
  incomeConfig,
  expenseConfig,
}) => {
  const incomeStats = useValueByPeriod({ config: incomeConfig }, [], 'kpi-net-income');
  const expenseStats = useValueByPeriod({ config: expenseConfig }, [], 'kpi-net-expense');
  const isLoading = incomeStats.isLoading || expenseStats.isLoading;
  const netRevenue = (incomeStats.currentValue as number) - (expenseStats.currentValue as number);

  return (
    <KpiTile isLoading={isLoading} label="Net Revenue · This Month">
      <p className="text-2xl font-bold tracking-tight">
        <MoneyValue amount={netRevenue} revertColors={netRevenue < 0} useColors={true} />
      </p>
      <p className={cn('text-xs font-medium', netRevenue >= 0 ? 'text-success' : 'text-destructive')}>
        {netRevenue >= 0 ? 'Surplus' : 'Deficit'}
      </p>
    </KpiTile>
  );
};

// ── Strip ─────────────────────────────────────────────────────────────────────

const renderTile = (tile: KpiTileConfig, index: number) => {
  switch (tile.kind) {
    case 'net-worth':
      return <NetWorthTile key={index} />;
    case 'stat':
      return <StatKpiTile key={index} {...tile} />;
    case 'net-revenue':
      return <NetRevenueTile expenseConfig={tile.expenseConfig} incomeConfig={tile.incomeConfig} key={index} />;
  }
};

const DashboardKpiStrip: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{kpiConfig.map(renderTile)}</div>
);

export default DashboardKpiStrip;
