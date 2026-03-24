import { computeFiTarget } from '../constants';
import type { ScenarioConfig, SimulationResult, StrategyMetrics } from '../models/types';

import { projectCashFlow } from './scenarioEngine';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRATEGY METRICS — KPI Computation
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * All metrics are derived from:
 *   - ScenarioConfig: the user's input parameters (income, expense, rates, events)
 *   - SimulationResult: the engine's output (monthly points, milestones)
 *
 * Metrics are organized into:
 *   1. Core sustainability: savings rate, buffer, runway, net worth, FI, yield
 *   2. Stress tests: expense shock tolerance, income loss tolerance
 *   3. Inflation impact: cumulative extra cost of living
 *
 * INFLATION NOTE:
 *   The engine uses nominal values — both income and expenses grow at inflation.
 *   The surplus ratio stays constant (if income = 4000, expense = 3000, ratio = 25%
 *   regardless of inflation). "Inflation drag" measures the cumulative extra cost
 *   of living over the horizon (in nominal terms).
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export const computeStrategyMetrics = (config: ScenarioConfig, result: SimulationResult): StrategyMetrics => {
  const { monthlyIncome, monthlyExpense, currentBalance, currentInvestmentValue } = config;

  // Savings rate: % of income retained after expenses (uses base month values —
  // ratio is inflation-invariant since both grow at the same rate)
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;

  // Buffer: months of current expenses covered by current cash
  const monthsCovered = monthlyExpense > 0 ? currentBalance / monthlyExpense : Infinity;

  // FI: 25× annual expenses (4% rule). Uses base expense — the engine handles
  // inflation internally when checking break-even against inflated expense.
  const fi = computeFiTarget(monthlyExpense);
  const fiProgress = fi > 0 ? (result.finalInvestmentValue / fi) * 100 : 0;

  // Investment yield: pure compound growth beyond contributions.
  // totalContributions = sum of all money moved to investments over the horizon.
  // pureGrowth = final value − starting value − contributions = compound earnings.
  const totalContributions = result.points.reduce((sum, p) => sum + p.investmentContribution, 0);
  const pureGrowth = result.finalInvestmentValue - currentInvestmentValue - totalContributions;
  const investmentYield = totalContributions > 0 ? (pureGrowth / totalContributions) * 100 : 0;

  // Stress tests: how much can income/expenses change before runway drops below 6 months?
  // Only run if the base scenario is already viable (runway > 6 months).
  const netWorthNeverDepleted = result.runwayMonths === null;
  const baseRunwayOk = netWorthNeverDepleted || (result.runwayMonths !== null && result.runwayMonths > 6);
  const maxExpenseShock = baseRunwayOk ? binarySearchThreshold(config, 'expense', 6) : 0;
  const incomeLossTolerance = baseRunwayOk ? binarySearchThreshold(config, 'income', 6) : 0;

  // Inflation drag: cumulative EXTRA expenses over the horizon vs today's prices.
  // Even though income also grows, this number shows how much more you'll spend
  // in absolute terms. Useful for understanding why "the same lifestyle" costs more.
  const years = config.horizonMonths / 12;
  const annualExpenseToday = monthlyExpense * 12;
  const cumulativeNominalExpense = result.points.reduce((sum, p) => sum + p.expense, 0);
  const cumulativeIfFlat = annualExpenseToday * years;
  const inflationDrag = Math.max(0, cumulativeNominalExpense - cumulativeIfFlat);

  return {
    savingsRate,
    monthsCovered,
    runway: result.runwayMonths,
    netWorthEoH: result.finalBalance + result.finalInvestmentValue,
    fiProgress,
    fiEta: result.breakEvenYears,
    investmentYield,
    totalContributions,
    maxExpenseShock,
    incomeLossTolerance,
    inflationDrag,
  };
};

/**
 * Binary search: find the max % change in income or expenses
 * before net worth depletes within `minRunwayMonths`.
 *
 * Caps horizon at 120 months (10y) for performance — stress tests
 * measure short/medium-term resilience, not 30y sustainability.
 */
const binarySearchThreshold = (config: ScenarioConfig, type: 'income' | 'expense', minRunwayMonths: number): number => {
  let lo = 0;
  let hi = 100;

  const cappedConfig = config.horizonMonths > 120 ? { ...config, horizonMonths: 120 as const } : config;

  for (let iter = 0; iter < 10; iter++) {
    const mid = (lo + hi) / 2;
    const testConfig = { ...cappedConfig };

    if (type === 'expense') {
      testConfig.monthlyExpense = config.monthlyExpense * (1 + mid / 100);
    } else {
      testConfig.monthlyIncome = config.monthlyIncome * (1 - mid / 100);
    }

    const testResult = projectCashFlow(testConfig);
    const fails = testResult.runwayMonths != null && testResult.runwayMonths <= minRunwayMonths;

    if (fails) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return Math.round(lo);
};
