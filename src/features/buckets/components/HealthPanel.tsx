import { Info } from 'lucide-react';
import React, { useRef } from 'react';

import { cn } from '@/lib/utils';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { type HealthSummary, statusColor, statusIcon } from '../hooks/useHealthRules';
import { type RuleWithResult } from '../hooks/useHealthRules';

interface Props {
  health: HealthSummary;
  monthlyExpenses: number | null;
  monthlyIncome: number | null;
  baseCurrency: string;
  onMonthlyExpensesChange: (value: number | null) => void;
}

const GRADE_COLOR: Record<string, string> = {
  A: 'text-success',
  B: 'text-success/75',
  C: 'text-warning',
  D: 'text-warning/75',
  F: 'text-destructive',
};

const HealthPanel: React.FC<Props> = ({
  health,
  monthlyExpenses,
  monthlyIncome,
  baseCurrency,
  onMonthlyExpensesChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const baseSym = CURRENCIES[baseCurrency as CURRENCY_CODE]?.symbol ?? baseCurrency;

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Score row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-baseline gap-1.5">
          <span className={cn('text-3xl font-bold tabular-nums', GRADE_COLOR[health.grade])}>{health.grade}</span>
          <span className="text-sm text-muted-foreground">{health.score}/100</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors ml-0.5">
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-xs space-y-1.5 p-3">
              <p className="font-semibold text-sm">Portfolio Health Score</p>
              <p>Scored across 10 personal finance rules. Each rule is: ✅ pass (+10), ⚠️ warn (+5), or ❌ fail (+0). N/A rules are excluded.</p>
              <p className="font-medium mt-1">Grade thresholds:</p>
              <ul className="space-y-0.5 pl-1">
                <li><span className="text-success font-bold">A</span> ≥ 90 — excellent</li>
                <li><span className="text-success/75 font-bold">B</span> ≥ 75 — good</li>
                <li><span className="text-warning font-bold">C</span> ≥ 60 — fair</li>
                <li><span className="text-warning/75 font-bold">D</span> ≥ 45 — needs work</li>
                <li><span className="text-destructive font-bold">F</span> &lt; 45 — critical</li>
              </ul>
              <p className="text-muted-foreground">Rules cover: emergency fund, savings rate, liquid reserves, diversification, currency strength, and more.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Score bar */}
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            style={{ width: `${health.score}%` }}
            className={cn('h-full rounded-full transition-all duration-500', {
              'bg-success': health.score >= 75,
              'bg-warning': health.score >= 45 && health.score < 75,
              'bg-destructive': health.score < 45,
            })}
          />
        </div>

        {/* Monthly stats */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Monthly expenses — editable, auto-seeded from backend */}
          <div className="flex items-center gap-2">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Avg expenses
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                {baseSym}
              </span>
              <Input
                min={0}
                placeholder="0"
                type="number"
                value={monthlyExpenses ?? ''}
                className="w-28 h-7 pl-6 text-xs"
                onChange={(e) => {
                  const v = e.target.value === '' ? null : Number(e.target.value);
                  onMonthlyExpensesChange(v && v > 0 ? v : null);
                }}
                ref={inputRef}
              />
            </div>
          </div>

          {/* Monthly income — read-only, auto from backend */}
          {monthlyIncome && (
            <div className="flex items-center gap-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Avg income
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold tabular-nums">
                  {baseSym}
                  {monthlyIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-muted-foreground italic">/mo</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {health.rules.map((rule) => (
          <RuleRow rule={rule} key={rule.id} />
        ))}
      </div>
    </div>
  );
};

const RuleRow: React.FC<{ rule: RuleWithResult }> = ({ rule }) => (
  <div className="flex items-start gap-2 text-xs py-0.5">
    <span className="shrink-0 mt-0.5 text-sm leading-none">{statusIcon(rule.result.status)}</span>
    <div className="min-w-0">
      <span className="font-medium">{rule.title}</span>
      <span className={cn('ml-1.5', statusColor(rule.result.status), rule.result.status === 'na' && 'italic')}>
        {rule.result.detail}
      </span>
    </div>
  </div>
);

export default HealthPanel;
