import { useMemo } from 'react';

import type { DiagnosticResult, DiagnosticStatus, ScenarioConfig, StrategyMetrics } from '../models/types';

interface DiagnosticRule {
  id: string;
  title: string;
  evaluate: (m: StrategyMetrics, c: ScenarioConfig) => DiagnosticResult;
}

const fmt = (n: number) => Math.round(n).toLocaleString();

const rules: DiagnosticRule[] = [
  // ── Cash Flow ──
  {
    id: 'savings-rate',
    title: 'Savings Rate',
    evaluate: (m) => {
      const pct = Math.round(m.savingsRate);
      if (pct >= 20)
        return {
          id: 'savings-rate',
          title: 'Savings Rate',
          status: 'pass',
          detail: `${pct}% of income saved`,
          suggestion: null,
        };
      if (pct >= 10)
        return {
          id: 'savings-rate',
          title: 'Savings Rate',
          status: 'warn',
          detail: `${pct}% — below the 20% target`,
          suggestion: `Reduce expenses by ${fmt(m.savingsRate < 20 ? ((20 - m.savingsRate) / 100) * m.savingsRate : 0)} or increase income to reach 20%`,
        };
      return {
        id: 'savings-rate',
        title: 'Savings Rate',
        status: 'fail',
        detail: `${pct}% — critically low`,
        suggestion: 'Savings below 10% severely limits wealth building. Review discretionary spending.',
      };
    },
  },
  {
    id: 'expense-stability',
    title: 'Expense Stability',
    evaluate: (_m, c) => {
      const cv = c.monthlyExpense > 0 ? c.expenseStdDev / c.monthlyExpense : 0;
      if (cv < 0.3)
        return {
          id: 'expense-stability',
          title: 'Expense Stability',
          status: 'pass',
          detail: `Low volatility (CV ${(cv * 100).toFixed(0)}%)`,
          suggestion: null,
        };
      if (cv < 0.5)
        return {
          id: 'expense-stability',
          title: 'Expense Stability',
          status: 'warn',
          detail: `Moderate volatility (CV ${(cv * 100).toFixed(0)}%)`,
          suggestion: 'Expenses vary significantly — fixed budgets would improve predictability',
        };
      return {
        id: 'expense-stability',
        title: 'Expense Stability',
        status: 'fail',
        detail: `High volatility (CV ${(cv * 100).toFixed(0)}%)`,
        suggestion: 'Highly unpredictable expenses make planning unreliable. Identify and stabilize variable costs.',
      };
    },
  },
  {
    id: 'surplus-positive',
    title: 'Positive Surplus',
    evaluate: (_m, c) => {
      const surplus = c.monthlyIncome - c.monthlyExpense;
      if (surplus > 0)
        return {
          id: 'surplus-positive',
          title: 'Positive Surplus',
          status: 'pass',
          detail: `+${fmt(surplus)}/mo surplus`,
          suggestion: null,
        };
      return {
        id: 'surplus-positive',
        title: 'Positive Surplus',
        status: 'fail',
        detail: `${fmt(surplus)}/mo deficit`,
        suggestion: 'Spending exceeds income — this is unsustainable. Cut expenses or increase income.',
      };
    },
  },
  // ── Safety ──
  {
    id: 'emergency-fund',
    title: 'Emergency Fund',
    evaluate: (m) => {
      const months = Math.round(m.monthsCovered * 10) / 10;
      if (months >= 6)
        return {
          id: 'emergency-fund',
          title: 'Emergency Fund',
          status: 'pass',
          detail: `${months} months of expenses covered`,
          suggestion: null,
        };
      if (months >= 3)
        return {
          id: 'emergency-fund',
          title: 'Emergency Fund',
          status: 'warn',
          detail: `${months} months — below 6-month target`,
          suggestion: `Build cash reserves to ${fmt(m.monthsCovered < 6 ? (6 - m.monthsCovered) * (m.monthsCovered > 0 ? m.monthsCovered : 1) : 0)} more before investing aggressively`,
        };
      return {
        id: 'emergency-fund',
        title: 'Emergency Fund',
        status: 'fail',
        detail: `Only ${months} months covered`,
        suggestion: 'Less than 3 months of cash reserves is risky. Prioritize emergency fund before investments.',
      };
    },
  },
  {
    id: 'runway-safe',
    title: 'Cash Runway',
    evaluate: (m) => {
      if (m.runway === null)
        return {
          id: 'runway-safe',
          title: 'Cash Runway',
          status: 'pass',
          detail: 'Cash never depletes within horizon',
          suggestion: null,
        };
      if (m.runway > 24)
        return {
          id: 'runway-safe',
          title: 'Cash Runway',
          status: 'pass',
          detail: `${m.runway} months until depletion`,
          suggestion: null,
        };
      if (m.runway > 12)
        return {
          id: 'runway-safe',
          title: 'Cash Runway',
          status: 'warn',
          detail: `${m.runway} months — getting tight`,
          suggestion: 'Consider reducing investment contributions to extend cash runway',
        };
      return {
        id: 'runway-safe',
        title: 'Cash Runway',
        status: 'fail',
        detail: `Only ${m.runway} months until cash runs out`,
        suggestion: 'Cash depletion within a year. Reduce savings rate or cut expenses immediately.',
      };
    },
  },
  {
    id: 'income-resilience',
    title: 'Income Resilience',
    evaluate: (m) => {
      if (m.incomeLossTolerance >= 30)
        return {
          id: 'income-resilience',
          title: 'Income Resilience',
          status: 'pass',
          detail: `Can absorb ${m.incomeLossTolerance}% income drop`,
          suggestion: null,
        };
      if (m.incomeLossTolerance >= 15)
        return {
          id: 'income-resilience',
          title: 'Income Resilience',
          status: 'warn',
          detail: `${m.incomeLossTolerance}% income drop tolerance`,
          suggestion: 'A moderate income shock could strain your finances within 6 months',
        };
      return {
        id: 'income-resilience',
        title: 'Income Resilience',
        status: 'fail',
        detail: `Only ${m.incomeLossTolerance}% drop tolerated`,
        suggestion: 'Very vulnerable to income disruption. Build larger cash buffer or reduce fixed expenses.',
      };
    },
  },
  // ── Wealth Building ──
  {
    id: 'investment-allocation',
    title: 'Investment Rate',
    evaluate: (_m, c) => {
      const rate = Math.round(c.savingsRate);
      if (rate >= 30)
        return {
          id: 'investment-allocation',
          title: 'Investment Rate',
          status: 'pass',
          detail: `${rate}% of surplus → investments`,
          suggestion: null,
        };
      if (rate >= 15)
        return {
          id: 'investment-allocation',
          title: 'Investment Rate',
          status: 'warn',
          detail: `${rate}% — moderate allocation`,
          suggestion: 'Consider increasing investment allocation to accelerate compound growth',
        };
      return {
        id: 'investment-allocation',
        title: 'Investment Rate',
        status: 'fail',
        detail: `Only ${rate}% invested`,
        suggestion: 'Low investment rate means most surplus sits as cash, losing to inflation.',
      };
    },
  },
  {
    id: 'compound-momentum',
    title: 'Compound Momentum',
    evaluate: (m) => {
      const yld = Math.round(m.investmentYield);
      if (yld > 20)
        return {
          id: 'compound-momentum',
          title: 'Compound Momentum',
          status: 'pass',
          detail: `${yld}% pure growth beyond contributions`,
          suggestion: null,
        };
      if (yld > 5)
        return {
          id: 'compound-momentum',
          title: 'Compound Momentum',
          status: 'warn',
          detail: `${yld}% growth — compounding is building`,
          suggestion: 'Extend your time horizon — compound growth accelerates exponentially over longer periods',
        };
      return {
        id: 'compound-momentum',
        title: 'Compound Momentum',
        status: 'fail',
        detail: `${yld}% — compound growth is minimal`,
        suggestion: 'Short horizons or low contributions limit compounding. Try 10y+ horizon to see the effect.',
      };
    },
  },
  {
    id: 'fi-trajectory',
    title: 'FI Trajectory',
    evaluate: (m) => {
      if (m.fiEta != null && m.fiEta <= 20)
        return {
          id: 'fi-trajectory',
          title: 'FI Trajectory',
          status: 'pass',
          detail: `FI reachable in ~${m.fiEta} years`,
          suggestion: null,
        };
      if (m.fiEta != null && m.fiEta <= 30)
        return {
          id: 'fi-trajectory',
          title: 'FI Trajectory',
          status: 'warn',
          detail: `FI in ~${m.fiEta} years — achievable but slow`,
          suggestion: 'Increase savings rate or reduce expenses to accelerate FI',
        };
      return {
        id: 'fi-trajectory',
        title: 'FI Trajectory',
        status: 'fail',
        detail: `FI not reachable within ${m.fiEta ? m.fiEta + ' years' : 'horizon'}`,
        suggestion:
          'At current pace, financial independence is very distant. A 10% savings rate increase could cut years off.',
      };
    },
  },
  // ── Risk ──
  {
    id: 'return-realistic',
    title: 'Return Rate Realism',
    evaluate: (_m, c) => {
      if (c.investmentReturnRate <= 8)
        return {
          id: 'return-realistic',
          title: 'Return Rate Realism',
          status: 'pass',
          detail: `${c.investmentReturnRate}% — conservative/realistic`,
          suggestion: null,
        };
      if (c.investmentReturnRate <= 12)
        return {
          id: 'return-realistic',
          title: 'Return Rate Realism',
          status: 'warn',
          detail: `${c.investmentReturnRate}% — optimistic`,
          suggestion: 'Returns above 8% are historically uncommon long-term. Stress-test with 5% to see downside.',
        };
      return {
        id: 'return-realistic',
        title: 'Return Rate Realism',
        status: 'fail',
        detail: `${c.investmentReturnRate}% — unrealistic`,
        suggestion: 'Returns above 12% are not sustainable. This projection is likely over-optimistic.',
      };
    },
  },
  {
    id: 'expense-shock',
    title: 'Expense Shock Buffer',
    evaluate: (m) => {
      if (m.maxExpenseShock >= 25)
        return {
          id: 'expense-shock',
          title: 'Expense Shock Buffer',
          status: 'pass',
          detail: `Can absorb ${m.maxExpenseShock}% expense increase`,
          suggestion: null,
        };
      if (m.maxExpenseShock >= 15)
        return {
          id: 'expense-shock',
          title: 'Expense Shock Buffer',
          status: 'warn',
          detail: `${m.maxExpenseShock}% shock tolerance`,
          suggestion: 'A moderate expense spike (medical, repair) could strain your plan',
        };
      return {
        id: 'expense-shock',
        title: 'Expense Shock Buffer',
        status: 'fail',
        detail: `Only ${m.maxExpenseShock}% tolerated`,
        suggestion: 'Very little margin for unexpected expenses. Build a larger emergency buffer.',
      };
    },
  },
  {
    id: 'cash-drag',
    title: 'Cash Drag',
    evaluate: (m, c) => {
      const totalAssets = c.currentBalance + c.currentInvestmentValue;
      const cashRatio = totalAssets > 0 ? c.currentBalance / totalAssets : 0;
      if (cashRatio <= 0.7 || m.monthsCovered <= 12)
        return {
          id: 'cash-drag',
          title: 'Cash Drag',
          status: 'pass',
          detail: `${Math.round(cashRatio * 100)}% in cash — balanced`,
          suggestion: null,
        };
      return {
        id: 'cash-drag',
        title: 'Cash Drag',
        status: 'warn',
        detail: `${Math.round(cashRatio * 100)}% in cash beyond 12mo buffer`,
        suggestion: `${fmt(c.currentBalance - c.monthlyExpense * 12)} excess cash losing to inflation — consider investing it`,
      };
    },
  },
];

const STATUS_POINTS: Record<DiagnosticStatus, number> = { pass: 10, warn: 5, fail: 0 };

export const useStrategyDiagnostics = (metrics: StrategyMetrics, config: ScenarioConfig) => {
  const results = useMemo(() => rules.map((rule) => rule.evaluate(metrics, config)), [metrics, config]);

  const score = useMemo(() => {
    const points = results.reduce((sum, r) => sum + STATUS_POINTS[r.status], 0);
    return Math.round((points / (results.length * 10)) * 100);
  }, [results]);

  const gradeFromScore = (s: number): string => {
    if (s >= 90) return 'A';
    if (s >= 75) return 'B';
    if (s >= 60) return 'C';
    if (s >= 45) return 'D';
    return 'F';
  };
  const grade = gradeFromScore(score);

  return { results, score, grade };
};
