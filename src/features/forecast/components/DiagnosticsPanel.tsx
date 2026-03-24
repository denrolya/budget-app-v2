import { AlertCircle, CheckCircle2, ChevronDown, XCircle } from 'lucide-react';
import React, { useState } from 'react';

import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { GRADE_COLOR } from '@/constants/ui';
import { cn } from '@/lib/utils';

import type { DiagnosticResult, DiagnosticStatus } from '../models/types';

interface Props {
  results: DiagnosticResult[];
  score: number;
  grade: string;
  defaultExpanded?: boolean;
}

const STATUS_ICON: Record<DiagnosticStatus, React.FC<{ className?: string }>> = {
  pass: CheckCircle2,
  warn: AlertCircle,
  fail: XCircle,
};

const STATUS_COLOR: Record<DiagnosticStatus, string> = {
  pass: 'text-success',
  warn: 'text-warning',
  fail: 'text-destructive',
};

const STATUS_BG: Record<DiagnosticStatus, string> = {
  pass: '',
  warn: 'bg-warning/[0.03]',
  fail: 'bg-destructive/[0.03]',
};

/** Educational explanations for each diagnostic rule — helps users learn financial concepts */
const RULE_EXPLAINERS: Record<string, string> = {
  'savings-rate':
    'The % of your income you keep after expenses. 20%+ is the benchmark for building wealth. Below 10% means you\'re living close to your means with little room for error.',
  'expense-stability':
    'How consistent your monthly expenses are (coefficient of variation). High volatility makes planning unreliable — consider what causes the swings.',
  'positive-surplus':
    'Whether you earn more than you spend each month. This is the foundation — without positive cash flow, no financial strategy can work.',
  'emergency-fund':
    'Months of expenses your cash can cover if income stops. 6 months is the standard safety net. Below 3 is risky — one surprise expense could cascade.',
  'cash-runway':
    'How many months before your cash hits zero in the current scenario. Infinite (∞) means your cash grows forever. Below 12 months is a red flag.',
  'income-resilience':
    'How much your income can drop before things break. Tests your scenario with lower income to find your safety margin. 30%+ drop tolerance is solid.',
  'investment-rate':
    'What % of your surplus goes to investments. 30%+ builds wealth actively. Below 15% means most surplus stays as idle cash losing to inflation.',
  'compound-momentum':
    'How much your investments grew beyond what you contributed. Higher = compounding is doing real work. Early on this will be low — that\'s normal.',
  'fi-trajectory':
    'Years until your investment returns cover your living expenses (Financial Independence). Based on 25× annual expenses at 4% withdrawal rate — a widely used retirement benchmark.',
  'return-realism':
    'Whether your assumed investment return rate is realistic. Historical stock market averages ~7-10%/year. Above 12% is speculative. Above 8% is optimistic.',
  'expense-shock':
    'How much your expenses could spike before your runway drops below 6 months. Tests resilience against unexpected cost increases.',
  'cash-drag':
    'Holding too much in cash (vs. invested) loses to inflation. If your buffer is already 12+ months and cash is >70% of net worth, excess cash is a drag on returns.',
};

const DiagnosticsPanel: React.FC<Props> = ({ results, score, grade, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const issueCount = results.filter((r) => r.status !== 'pass').length;
  const passCount = results.filter((r) => r.status === 'pass').length;

  // Group rules by category for structured display
  const groups = [
    { label: 'Cash Flow', ids: ['savings-rate', 'expense-stability', 'positive-surplus'] },
    { label: 'Safety', ids: ['emergency-fund', 'cash-runway', 'income-resilience'] },
    { label: 'Wealth', ids: ['investment-rate', 'compound-momentum', 'fi-trajectory'] },
    { label: 'Risk', ids: ['return-realism', 'expense-shock', 'cash-drag'] },
  ];

  const ruleMap = new Map(results.map((r) => [r.id, r]));

  return (
    <div className="border-t bg-card">
      {/* Header bar — always visible */}
      <button
        type="button"
        className="w-full px-3 py-1 flex items-center gap-3 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Grade */}
        <ResponsiveTooltip
          content={
            <div className="text-xs space-y-1.5 text-primary-foreground">
              <p className="font-medium">Strategy Health: 12 Financial Rules</p>
              <p className="text-primary-foreground/70">
                Each rule scores 10 points (pass), 5 (warn), or 0 (fail). Total is normalized to 0-100. This measures
                how robust your financial strategy is — not just whether you have money, but whether your plan is
                sustainable.
              </p>
              <div className="border-t border-primary-foreground/20 pt-1.5 space-y-0.5 font-mono tabular-nums">
                <p>
                  <span className="text-success font-bold">A</span> ≥85 — Excellent: resilient strategy
                </p>
                <p>
                  <span className="text-success/75 font-bold">B</span> ≥70 — Good: minor improvements possible
                </p>
                <p>
                  <span className="text-warning font-bold">C</span> ≥55 — Fair: some risks need attention
                </p>
                <p>
                  <span className="text-warning/75 font-bold">D</span> ≥40 — Weak: significant vulnerabilities
                </p>
                <p>
                  <span className="text-destructive font-bold">F</span> &lt;40 — Critical: strategy needs rework
                </p>
              </div>
            </div>
          }
          contentClassName="p-2 max-w-[320px]"
        >
          <span
            className={cn('text-lg font-bold font-mono cursor-help', GRADE_COLOR[grade] ?? 'text-muted-foreground')}
          >
            {grade}
          </span>
        </ResponsiveTooltip>

        {/* Score bar */}
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            style={{ width: `${score}%` }}
            className={cn('h-full rounded-full transition-all', {
              'bg-success': score >= 75,
              'bg-warning': score >= 45 && score < 75,
              'bg-destructive': score < 45,
            })}
          />
        </div>

        {/* Score + summary */}
        <span className="text-2xs font-mono tabular-nums text-muted-foreground">{score}/100</span>
        <span className="text-2xs font-mono text-success">{passCount}✓</span>
        {issueCount > 0 && <span className="text-2xs font-mono text-warning">{issueCount}!</span>}
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', { 'rotate-180': expanded })} />
      </button>

      {/* Expanded rules grid — grouped by category */}
      {expanded && (
        <div className="px-3 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-4 gap-x-3 gap-y-0">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="text-3xs font-medium uppercase tracking-widest text-muted-foreground/40 py-1 border-b border-border/30 mb-1">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.ids.map((id) => {
                    const r = ruleMap.get(id);
                    if (!r) return null;
                    const Icon = STATUS_ICON[r.status];
                    const explainer = RULE_EXPLAINERS[id];

                    return (
                      <ResponsiveTooltip
                        content={
                          <div className="text-xs space-y-1.5 text-primary-foreground">
                            <p className="font-medium">{r.title}</p>
                            <p className={cn(STATUS_COLOR[r.status])}>{r.detail}</p>
                            {explainer && (
                              <p className="text-primary-foreground/70 border-t border-primary-foreground/20 pt-1.5">
                                {explainer}
                              </p>
                            )}
                            {r.suggestion && r.status !== 'pass' && (
                              <p className="text-primary-foreground font-medium border-t border-primary-foreground/20 pt-1.5">
                                Tip: {r.suggestion}
                              </p>
                            )}
                          </div>
                        }
                        contentClassName="p-2 max-w-[300px]"
                        key={id}
                      >
                        <div
                          className={cn(
                            'flex items-center gap-1.5 py-0.5 px-1 rounded-sm cursor-help transition-colors hover:bg-muted/50',
                            STATUS_BG[r.status],
                          )}
                        >
                          <Icon className={cn('h-3 w-3 shrink-0', STATUS_COLOR[r.status])} />
                          <span className="text-2xs font-medium truncate">{r.title}</span>
                          <span
                            className={cn('text-2xs font-mono tabular-nums ml-auto shrink-0', STATUS_COLOR[r.status])}
                          >
                            {r.detail.split(':').pop()?.trim().split(' ')[0] ?? ''}
                          </span>
                        </div>
                      </ResponsiveTooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsPanel;
