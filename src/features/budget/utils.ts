import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import type { Category } from '@/features/categories';

/** Returns the category's own ID plus all descendant IDs (depth-first). */
export const getAllDescendantIds = (category: Category): number[] => {
  const ids: number[] = [category.id];
  for (const child of category.children) ids.push(...getAllDescendantIds(child));
  return ids;
};

/** Formats a monetary amount with the currency symbol, always positive display. */
export const formatBudgetAmount = (amount: number, currency: string): string => {
  const currencySymbol = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

/** Formats a percentage change with a sign prefix, e.g. +15% or -3%. */
export const formatPercent = (value: number): string => `${value > 0 ? '+' : ''}${value}%`;

export interface HealthResult {
  score: number;
  grade: string;
  gradeColor: string;
  factors: {
    overspendPenalty: number;
    pacePenalty: number;
    incomePenalty: number;
    paceAhead: number;
    incomePct: number;
  };
}

/** Returns the Tailwind color class for a remaining budget amount. */
export const getRemainingColorClass = (isExpense: boolean, remaining: number | null, pct: number | null): string => {
  if (isExpense) {
    if (remaining !== null && remaining < 0) return 'text-destructive';
    if (pct !== null && pct > 80) return 'text-warning';
    return 'text-success';
  }
  if (pct !== null && pct < 80) return 'text-destructive';
  if (pct !== null && pct < 100) return 'text-warning';
  return 'text-success';
};

/** Returns the Tailwind color class for a trend direction relative to expense/income semantics. */
export const getTrendColorClass = (isExpense: boolean, direction: 'up' | 'down' | 'stable'): string => {
  if (direction === 'stable') return '';
  if (isExpense) return direction === 'up' ? 'text-destructive' : 'text-success';
  return direction === 'up' ? 'text-success' : 'text-destructive';
};

export const computeHealthScore = (
  percentUsed: number,
  daysElapsed: number,
  daysTotal: number,
  totalPlannedIncome: number,
  totalActualIncome: number,
): HealthResult => {
  let score = 100;
  let overspendPenalty = 0;
  let pacePenalty = 0;
  let incomePenalty = 0;
  let paceAhead = 0;
  const incomePct = totalPlannedIncome > 0 ? (totalActualIncome / totalPlannedIncome) * 100 : 100;

  if (percentUsed > 100) {
    overspendPenalty = Math.min(50, (percentUsed - 100) * 2);
    score -= overspendPenalty;
  } else if (percentUsed > 85) {
    overspendPenalty = Math.round((percentUsed - 85) * 0.5);
    score -= overspendPenalty;
  }

  if (daysTotal > 0 && daysElapsed > 0 && daysElapsed < daysTotal) {
    const expectedPct = (daysElapsed / daysTotal) * 100;
    paceAhead = Math.max(0, percentUsed - expectedPct);
    if (paceAhead > 5) {
      pacePenalty = Math.min(20, (paceAhead - 5) * 0.5);
      score -= pacePenalty;
    }
  }

  if (totalPlannedIncome > 0 && incomePct < 90) {
    incomePenalty = Math.min(15, (90 - incomePct) * 0.3);
    score -= incomePenalty;
  }

  score = Math.max(0, Math.round(score));

  let grade: string;
  let gradeColor: string;
  if (score >= 90) {
    grade = 'A';
    gradeColor = 'text-success';
  } else if (score >= 75) {
    grade = 'B';
    gradeColor = 'text-success/75';
  } else if (score >= 60) {
    grade = 'C';
    gradeColor = 'text-warning';
  } else if (score >= 45) {
    grade = 'D';
    gradeColor = 'text-warning/75';
  } else {
    grade = 'F';
    gradeColor = 'text-destructive';
  }

  return {
    score,
    grade,
    gradeColor,
    factors: {
      overspendPenalty: Math.round(overspendPenalty * 10) / 10,
      pacePenalty: Math.round(pacePenalty * 10) / 10,
      incomePenalty: Math.round(incomePenalty * 10) / 10,
      paceAhead: Math.round(paceAhead),
      incomePct: Math.round(incomePct),
    },
  };
};
