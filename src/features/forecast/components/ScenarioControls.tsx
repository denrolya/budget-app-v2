import { RotateCcw } from 'lucide-react';
import React, { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

import type { ScenarioConfig } from '../models/types';

interface Props {
  config: ScenarioConfig;
  defaults: ScenarioConfig;
  onChange: (overrides: Partial<ScenarioConfig>) => void;
  onReset: () => void;
}

const DeltaBadge: React.FC<{ current: number; baseline: number; invertColor?: boolean }> = ({
  current,
  baseline,
  invertColor = false,
}) => {
  const delta = current - baseline;
  if (delta === 0) return null;

  const pct = baseline !== 0 ? Math.round((delta / Math.abs(baseline)) * 100) : 0;
  const sign = delta > 0 ? '+' : '';
  const isPositive = delta > 0;
  const colorMap = invertColor
    ? { pos: 'text-destructive', neg: 'text-success' }
    : { pos: 'text-success', neg: 'text-destructive' };
  const colorClass = isPositive ? colorMap.pos : colorMap.neg;

  return (
    <span className={cn('text-3xs font-mono tabular-nums', colorClass)}>
      {sign}
      {Math.round(delta).toLocaleString()} / {sign}
      {pct}%
    </span>
  );
};

const TipLabel: React.FC<{ label: string; tip: string }> = ({ label, tip }) => (
  <ResponsiveTooltip
    content={<span className="text-xs text-primary-foreground">{tip}</span>}
    contentClassName="p-2 max-w-[220px]"
  >
    <span className="text-2xs uppercase tracking-wider cursor-help border-b border-dotted border-muted-foreground/30">
      {label}
    </span>
  </ResponsiveTooltip>
);

const ScenarioControls: React.FC<Props> = ({ config, defaults, onChange, onReset }) => {
  const hasOverrides =
    config.monthlyIncome !== defaults.monthlyIncome ||
    config.monthlyExpense !== defaults.monthlyExpense ||
    config.savingsRate !== defaults.savingsRate ||
    config.investmentReturnRate !== defaults.investmentReturnRate ||
    config.inflationRate !== defaults.inflationRate ||
    config.incomeGrowthRate !== defaults.incomeGrowthRate ||
    config.minCashReserveMonths !== defaults.minCashReserveMonths ||
    config.currentBalance !== defaults.currentBalance ||
    config.currentInvestmentValue !== defaults.currentInvestmentValue;

  const handleNumber = useCallback(
    (field: keyof ScenarioConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value === '' ? 0 : Number(e.target.value);
      onChange({ [field]: val });
    },
    [onChange],
  );

  return (
    <div className="space-y-4">
      {/* ── Cash Flow ── */}
      <div className="space-y-2">
        <h3 className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">Cash Flow</h3>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <TipLabel
              label="Income /mo"
              tip="Average monthly income based on your last 12 months. Change it to simulate a raise or income drop."
            />
            <DeltaBadge baseline={defaults.monthlyIncome} current={config.monthlyIncome} />
          </div>
          <Input
            min={0}
            step={100}
            type="number"
            value={config.monthlyIncome}
            className="h-7 text-xs font-mono tabular-nums"
            onChange={handleNumber('monthlyIncome')}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <TipLabel
              label="Expenses /mo"
              tip="Average monthly expenses from last 12 months. Adjust to see how spending changes affect your runway."
            />
            <DeltaBadge invertColor baseline={defaults.monthlyExpense} current={config.monthlyExpense} />
          </div>
          <Input
            min={0}
            step={100}
            type="number"
            value={config.monthlyExpense}
            className="h-7 text-xs font-mono tabular-nums"
            onChange={handleNumber('monthlyExpense')}
          />
        </div>
      </div>

      {/* ── Savings & Investment ── */}
      <div className="space-y-2">
        <h3 className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">Investment</h3>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <TipLabel
              label="Savings Rate"
              tip="Percentage of your monthly surplus (income − expenses) that goes to investments. The rest stays as cash."
            />
            <span className="text-2xs font-mono tabular-nums text-muted-foreground">
              {Math.round(config.savingsRate)}%
            </span>
          </div>
          <Slider
            max={100}
            min={0}
            step={1}
            value={[config.savingsRate]}
            onValueChange={([v]) => onChange({ savingsRate: v })}
          />
        </div>

        <div className="space-y-1">
          <TipLabel
            label="Return Rate (annual)"
            tip="Expected annual return on your investment portfolio. Default 6.6% is based on a diversified ETF allocation. Adjust for different strategies."
          />
          <div className="relative">
            <Input
              max={30}
              min={0}
              step={0.1}
              type="number"
              value={config.investmentReturnRate}
              className="h-7 text-xs font-mono tabular-nums pr-6"
              onChange={handleNumber('investmentReturnRate')}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-muted-foreground">%</span>
          </div>
        </div>

        <div className="space-y-1">
          <TipLabel
            label="Inflation (annual)"
            tip="Annual inflation rate applied to expenses. At 3%, your expenses double every 24 years. Set to 0 for nominal projections."
          />
          <div className="relative">
            <Input
              max={20}
              min={0}
              step={0.5}
              type="number"
              value={config.inflationRate}
              className="h-7 text-xs font-mono tabular-nums pr-6"
              onChange={handleNumber('inflationRate')}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-muted-foreground">%</span>
          </div>
        </div>

        <div className="space-y-1">
          <TipLabel
            label="Income Growth (annual)"
            tip="Annual rate your income grows. Defaults to inflation rate (income keeps pace). Set higher for career growth, lower if income is stagnant."
          />
          <div className="relative">
            <Input
              max={20}
              min={0}
              step={0.5}
              type="number"
              value={config.incomeGrowthRate}
              className="h-7 text-xs font-mono tabular-nums pr-6"
              onChange={handleNumber('incomeGrowthRate')}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      {/* ── Starting Position ── */}
      <div className="space-y-2">
        <h3 className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">Starting Position</h3>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <TipLabel
              label="Balance"
              tip="Your current total cash balance across all accounts. Change it to simulate starting from a different position."
            />
            <DeltaBadge baseline={defaults.currentBalance} current={config.currentBalance} />
          </div>
          <Input
            step={1000}
            type="number"
            value={Math.round(config.currentBalance)}
            className="h-7 text-xs font-mono tabular-nums"
            onChange={handleNumber('currentBalance')}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <TipLabel
              label="Investment Value"
              tip="How much of your total balance is in investments. Subtracted from Balance to compute cash. Set this to your actual investment portfolio value."
            />
            {defaults.currentInvestmentValue > 0 && (
              <DeltaBadge baseline={defaults.currentInvestmentValue} current={config.currentInvestmentValue} />
            )}
          </div>
          <Input
            min={0}
            step={1000}
            type="number"
            value={Math.round(config.currentInvestmentValue)}
            className="h-7 text-xs font-mono tabular-nums"
            onChange={handleNumber('currentInvestmentValue')}
          />
        </div>

        <div className="space-y-1">
          <TipLabel
            label="Min Cash Reserve"
            tip="Minimum cash reserve in months of expenses. E.g. 6 = six months of expenses kept as cash. When cash drops below this floor, investment contributions are reduced. The floor grows with inflation (your expenses grow, so the reserve grows). Set to 0 for no floor."
          />
          <div className="relative">
            <Input
              max={24}
              min={0}
              step={0.5}
              type="number"
              value={config.minCashReserveMonths}
              className="h-7 text-xs font-mono tabular-nums pr-10"
              onChange={handleNumber('minCashReserveMonths')}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-muted-foreground">mo</span>
          </div>
        </div>
      </div>

      {/* ── Reset ── */}
      {hasOverrides && (
        <ResponsiveTooltip
          content={
            <span className="text-xs text-primary-foreground">Restore all values to your actual financial data</span>
          }
          contentClassName="p-2 max-w-[200px]"
        >
          <Button size="sm" variant="outline" className="w-full h-7 text-2xs" onClick={onReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset to actuals
          </Button>
        </ResponsiveTooltip>
      )}
    </div>
  );
};

export default ScenarioControls;
