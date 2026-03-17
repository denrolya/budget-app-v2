import { useMemo } from 'react';

import { type HealthContext, type HealthResult, type HealthRule, type RuleStatus } from '../models/types';

const RULES: HealthRule[] = [
  {
    id: 'emergency-fund',
    title: 'Emergency Reserve ≥ 6 months expenses',
    evaluate: ({ bucketBalances, monthlyExpenses }): HealthResult => {
      const balance = bucketBalances['reserve'] ?? 0;
      if (!monthlyExpenses) return na('Set monthly expenses below');
      const months = balance / monthlyExpenses;
      if (months >= 6) return pass(`${months.toFixed(1)} months covered`);
      if (months >= 3) return warn(`${months.toFixed(1)} months (target: 6)`);
      return fail(`${months.toFixed(1)} months (target: 6)`);
    },
  },
  {
    id: 'investments-after-emergency',
    title: 'Investments only after Emergency Reserve ≥ 3 months',
    evaluate: ({ bucketBalances, monthlyExpenses }): HealthResult => {
      const invBalance = bucketBalances['investments'] ?? 0;
      if (invBalance <= 0) return pass('No investments yet');
      if (!monthlyExpenses) return na('Set monthly expenses below');
      const efMonths = (bucketBalances['reserve'] ?? 0) / monthlyExpenses;
      if (efMonths >= 3) return pass(`Reserve = ${efMonths.toFixed(1)} months ✓`);
      return warn(`Reserve = ${efMonths.toFixed(1)} months — build reserve first`);
    },
  },
  {
    id: 'debt-load',
    title: 'Debt load ≤ 25% of income',
    evaluate: (): HealthResult => na('Needs monthly income data'),
  },
  {
    id: 'savings-rate',
    title: 'Savings rate ≥ 20% of income',
    evaluate: ({ monthlyIncome, monthlyExpenses }): HealthResult => {
      if (!monthlyIncome) return na('Auto-detected when transactions exist');
      if (!monthlyExpenses) return na('Set monthly expenses below');
      const rate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
      if (rate >= 20) return pass(`${rate.toFixed(0)}% of income saved`);
      if (rate >= 10) return warn(`${rate.toFixed(0)}% (target ≥20%)`);
      return fail(`${rate.toFixed(0)}% — spending exceeds saving target`);
    },
  },
  {
    id: 'liquid-reserves',
    title: '1–2 months expenses immediately accessible',
    evaluate: ({ bucketBalances, monthlyExpenses }): HealthResult => {
      const liquid = bucketBalances['operational'] ?? 0;
      if (!monthlyExpenses) return na('Set monthly expenses below');
      const months = liquid / monthlyExpenses;
      if (months >= 1) return pass(`${months.toFixed(1)} months liquid`);
      if (months >= 0.5) return warn(`${months.toFixed(1)} months (target: 1–2)`);
      return fail(`${months.toFixed(1)} months (target: 1–2)`);
    },
  },
  {
    id: 'no-single-dominant',
    title: 'No single account > 40% of portfolio',
    evaluate: ({ totalBalance, maxSingleAccountBalance }): HealthResult => {
      if (totalBalance <= 0) return na('No positive balance');
      const pct = (maxSingleAccountBalance / totalBalance) * 100;
      if (pct <= 40) return pass(`Max single account: ${pct.toFixed(0)}%`);
      if (pct <= 60) return warn(`Max: ${pct.toFixed(0)}% (target ≤40%)`);
      return fail(`Max: ${pct.toFixed(0)}% (target ≤40%)`);
    },
  },
  {
    id: 'investments-not-operational',
    title: 'Investment accounts not in operational bucket',
    evaluate: ({ entriesByBucket }): HealthResult => {
      const invIds = new Set((entriesByBucket['investments'] ?? []).map((e) => e.account.id));
      const opIds = new Set((entriesByBucket['operational'] ?? []).map((e) => e.account.id));
      const overlap = [...invIds].filter((id) => opIds.has(id));
      if (overlap.length > 0) return fail(`${overlap.length} account(s) in both`);
      if (invIds.size === 0) return pass('No investment accounts');
      if (opIds.size === 0) return warn('No operational accounts defined');
      return pass('Investment accounts separate');
    },
  },
  {
    id: 'strong-currency',
    title: 'Capital in strong currencies ≥ 70%',
    evaluate: ({ totalBalance, strongCurrencyBalance }): HealthResult => {
      if (totalBalance <= 0) return na('No positive balance');
      const pct = (strongCurrencyBalance / totalBalance) * 100;
      if (pct >= 70) return pass(`${pct.toFixed(0)}% in strong currencies`);
      if (pct >= 50) return warn(`${pct.toFixed(0)}% (target ≥70%)`);
      return fail(`${pct.toFixed(0)}% (target ≥70%)`);
    },
  },
  {
    id: 'jurisdiction',
    title: '≤ 50% capital in one jurisdiction',
    evaluate: (): HealthResult => na('Needs jurisdiction data per account'),
  },
  {
    id: 'survival',
    title: '≥ 6 months survival without income',
    evaluate: ({ totalBalance, bucketBalances, monthlyExpenses }): HealthResult => {
      const liquid = totalBalance - (bucketBalances['investments'] ?? 0);
      if (!monthlyExpenses) return na('Set monthly expenses below');
      const months = liquid / monthlyExpenses;
      if (months >= 6) return pass(`${months.toFixed(1)} months`);
      if (months >= 3) return warn(`${months.toFixed(1)} months (target: 6)`);
      return fail(`${months.toFixed(1)} months (target: 6)`);
    },
  },
];

const pass = (detail: string): HealthResult => ({ status: 'pass', detail });
const warn = (detail: string): HealthResult => ({ status: 'warn', detail });
const fail = (detail: string): HealthResult => ({ status: 'fail', detail });
const na = (detail: string): HealthResult => ({ status: 'na', detail });

export const useHealthRules = (ctx: HealthContext) =>
  useMemo(() => {
    const rules = RULES.map((rule) => ({ ...rule, result: rule.evaluate(ctx) }));
    const evaluable = rules.filter((r) => r.result.status !== 'na');
    const score =
      evaluable.length === 0
        ? 0
        : Math.round(
            (evaluable.reduce((s, r) => {
              if (r.result.status === 'pass') return s + 10;
              if (r.result.status === 'warn') return s + 5;
              return s;
            }, 0) /
              (evaluable.length * 10)) *
              100,
          );
    const grade: 'A' | 'B' | 'C' | 'D' | 'F' =
      score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';

    return { rules, score, grade };
  }, [ctx]);

export type RuleWithResult = ReturnType<typeof useHealthRules>['rules'][number];
export type HealthSummary = ReturnType<typeof useHealthRules>;

export const statusColor = (status: RuleStatus): string => {
  switch (status) {
    case 'pass':
      return 'text-success';
    case 'warn':
      return 'text-warning';
    case 'fail':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
};

export const statusIcon = (status: RuleStatus): string => {
  switch (status) {
    case 'pass':
      return '✅';
    case 'warn':
      return '⚠️';
    case 'fail':
      return '❌';
    default:
      return '—';
  }
};
