import { CONFIDENCE_MULTIPLIER } from '../constants';
import type { HistoricalFlow, ProjectionPoint, ScenarioConfig, SimulationResult } from '../models/types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FINANCIAL PROJECTION ENGINE — Business Model Documentation
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * APPROACH: Nominal (not inflation-adjusted)
 *   - All values are in future dollars (prices of the day)
 *   - Both income and expenses grow at the inflation rate
 *   - Investment returns are nominal (include inflation premium)
 *   - This means: a 6.6% nominal return with 3% inflation ≈ 3.5% real return
 *
 * MONTH-BY-MONTH LOOP:
 *   1. Compute this month's income and expense (base × seasonal × inflation)
 *   2. Apply any active events (one-time or recurring)
 *   3. Calculate net flow = income − expense
 *   4. If surplus > 0: split by savings rate → cash + investments
 *   5. If deficit < 0: subtract from cash
 *   6. Compound existing investments + add new contributions
 *   7. If cash < 0 and investments > 0: auto-liquidate investments to cover
 *   8. Record point with confidence bands
 *
 * KEY INVARIANTS:
 *   - Net worth = cash + investments (always)
 *   - Net worth ≥ investments (cash never goes below 0 while investments exist)
 *   - Net worth can go negative only when all investments are depleted (true debt)
 *   - Confidence bands scale with both time and inflation
 *   - FI break-even uses the INFLATED expense for that month, not the base
 *
 * KNOWN LIMITATIONS:
 *   - Recurring event amounts are nominal (a +500 raise stays 500 forever)
 *   - No tax modeling
 *   - Investment returns are deterministic (no volatility modeling)
 *   - Seasonal factors are static (same pattern every year)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Convert annual return rate to monthly compounding rate.
 * e.g. 6.6% annual → ~0.534% monthly
 */
const annualToMonthlyRate = (annualPercent: number): number => Math.pow(1 + annualPercent / 100, 1 / 12) - 1;

/**
 * Format year + 0-indexed month as 'YYYY-MM-01' string.
 * Avoids Date object to prevent timezone-related day shifts.
 */
const toDateKey = (year: number, month: number): string => {
  const m = String(month + 1).padStart(2, '0');
  return `${year}-${m}-01`;
};

/**
 * Add N months to a year/month pair, returning [year, month].
 */
const addMonths = (year: number, month: number, n: number): [number, number] => {
  const total = year * 12 + month + n;
  return [Math.floor(total / 12), total % 12];
};

/**
 * Project cash flow and investment growth month-by-month.
 */
export const projectCashFlow = (config: ScenarioConfig): SimulationResult => {
  const {
    currentBalance,
    monthlyIncome,
    monthlyExpense,
    savingsRate,
    investmentReturnRate,
    currentInvestmentValue,
    horizonMonths,
    events,
    incomeStdDev,
    expenseStdDev,
    inflationRate,
    incomeGrowthRate,
    minCashReserveMonths,
    seasonalFactors,
  } = config;

  const monthlyRate = annualToMonthlyRate(investmentReturnRate);
  const monthlyInflation = annualToMonthlyRate(inflationRate);
  const monthlyIncomeGrowth = annualToMonthlyRate(incomeGrowthRate);
  const combinedStdDev = Math.sqrt(incomeStdDev ** 2 + expenseStdDev ** 2);
  const savingsFraction = Math.max(0, Math.min(100, savingsRate)) / 100;

  // Start projection from NEXT month — the current balance already reflects
  // this month's partial activity. Projecting from current month would double-count.
  const now = new Date();
  const [startYear, startMonth] = addMonths(now.getFullYear(), now.getMonth(), 1);

  const points: ProjectionPoint[] = [];
  // currentBalance = total net worth (includes investment accounts).
  // Subtract investmentValue to get pure cash — avoids double-counting.
  let balance = currentBalance - currentInvestmentValue;
  let investmentValue = currentInvestmentValue;
  let runwayMonths: number | null = null;
  let breakEvenYears: number | null = null;

  const activeEvents = events.filter((e) => e.isActive);
  const recurringEvents = activeEvents.filter((e) => e.recurring);
  const oneTimeEvents = activeEvents.filter((e) => !e.recurring);

  for (let i = 0; i < horizonMonths; i++) {
    const [y, m] = addMonths(startYear, startMonth, i);
    const dateKey = toDateKey(y, m);
    const monthIndex = i + 1;

    // ── Step 1: Base flows ──────────────────────────────────────────────────
    // Both income and expenses grow at the inflation rate (nominal approach).
    // Income keeping pace with inflation = salary cost-of-living adjustments.
    // Seasonal factors adjust for calendar-month patterns from historical data.
    const seasonal = seasonalFactors[m]; // m is 0-indexed calendar month
    const seasonalIncome = seasonal?.income ?? 1;
    const seasonalExpense = seasonal?.expense ?? 1;
    const expenseInflation = (1 + monthlyInflation) ** i;
    const incomeInflation = (1 + monthlyIncomeGrowth) ** i;
    let income = monthlyIncome * seasonalIncome * incomeInflation;
    let expense = monthlyExpense * seasonalExpense * expenseInflation;
    let eventDirectInvest = 0;

    // ── Step 2: Apply events ────────────────────────────────────────────────
    // Events are NOMINAL — a +500 raise stays +500 regardless of inflation.
    // This is realistic: raises are negotiated in absolute terms.
    const applyEvent = (event: (typeof activeEvents)[0]) => {
      const amt = Math.abs(event.amount);
      const isIncome = event.type === 'income' || event.type === 'investment';

      if (isIncome) {
        if (event.investPercent != null) {
          eventDirectInvest += amt * (event.investPercent / 100);
          income += amt * (1 - event.investPercent / 100);
        } else {
          income += amt;
        }
      } else {
        expense += amt;
      }
    };

    for (const event of recurringEvents) {
      if (dateKey >= event.month) applyEvent(event);
    }
    for (const event of oneTimeEvents) {
      if (event.month === dateKey) applyEvent(event);
    }

    // ── Step 3: Cash flow allocation ────────────────────────────────────────
    const netFlow = income - expense;

    // Savings rate applies only to POSITIVE surplus.
    // When in deficit (expense > income), ALL deficit comes from cash.
    let surplusToInvest = netFlow > 0 ? netFlow * savingsFraction : 0;

    // Emergency fund floor: reserve = months × current inflated expense.
    // Grows with inflation so the floor maintains real purchasing power.
    if (minCashReserveMonths > 0 && netFlow > 0) {
      const reserveFloor = minCashReserveMonths * expense;
      const cashAfterInvest = balance + netFlow - surplusToInvest;
      if (cashAfterInvest < reserveFloor) {
        const maxInvest = Math.max(0, balance + netFlow - reserveFloor);
        surplusToInvest = Math.min(surplusToInvest, maxInvest);
      }
    }

    const investmentContribution = surplusToInvest + eventDirectInvest;

    // Cash gets: full net flow minus what's diverted to investments
    balance += netFlow - surplusToInvest;

    // ── Step 4: Investment compounding ──────────────────────────────────────
    // Existing portfolio compounds, then new contributions are added.
    // Order matters: contributions this month don't earn returns this month.
    investmentValue = investmentValue * (1 + monthlyRate) + investmentContribution;

    // ── Step 5: Auto-liquidation ────────────────────────────────────────────
    // If cash is negative and investments exist, sell investments to cover.
    // In reality you'd liquidate before going into debt.
    // Cash floors at 0 while investments shrink.
    if (balance < 0 && investmentValue > 0) {
      const deficit = Math.abs(balance);
      const withdrawal = Math.min(deficit, investmentValue);
      balance += withdrawal;
      investmentValue -= withdrawal;
    }

    // ── Step 6: Confidence bands ────────────────────────────────────────────
    // Band width = multiplier × sqrt(months) × combined stdDev × inflation
    // - sqrt(months): cumulative random walk uncertainty
    // - inflationMultiplier: variance scales with nominal values
    const bandWidth = CONFIDENCE_MULTIPLIER * Math.sqrt(monthIndex) * combinedStdDev * expenseInflation;

    // ── Step 7: Milestone tracking ──────────────────────────────────────────
    // Runway: first month total net worth (cash + investments) hits 0
    const netWorth = balance + investmentValue;
    if (runwayMonths === null && netWorth <= 0) {
      runwayMonths = monthIndex;
    }

    // FI break-even: investment MONTHLY returns cover THIS MONTH'S expenses
    // Uses inflated expense (not base) — you need returns to cover actual costs
    if (breakEvenYears === null && investmentValue * monthlyRate >= expense) {
      breakEvenYears = Math.round((monthIndex / 12) * 10) / 10;
    }

    points.push({
      date: dateKey,
      balance,
      balanceUpper: balance + bandWidth,
      balanceLower: balance - bandWidth,
      investmentValue,
      income,
      expense,
      netFlow,
      investmentContribution,
      isForecast: true,
    });
  }

  const last = points[points.length - 1];

  return {
    points,
    finalBalance: last?.balance ?? currentBalance,
    finalInvestmentValue: last?.investmentValue ?? currentInvestmentValue,
    runwayMonths,
    breakEvenYears,
  };
};

/**
 * Reconstruct historical balance by walking backwards from current balance.
 *
 * Given today's balance and past monthly income/expense data (oldest first),
 * produces ProjectionPoints with isForecast=false. The last point in the
 * returned array represents the most recent historical month.
 */
export const reconstructHistoricalBalance = (
  currentBalance: number,
  pastFlows: HistoricalFlow[],
): ProjectionPoint[] => {
  if (pastFlows.length === 0) return [];

  // Walk backwards: for each month, prevBalance = nextBalance - netFlow
  const balances: number[] = new Array(pastFlows.length);
  let bal = currentBalance;

  // pastFlows are oldest-first; walk from newest to oldest
  for (let i = pastFlows.length - 1; i >= 0; i--) {
    const { income, expense } = pastFlows[i];
    bal -= income - expense; // undo this month's flow to get start-of-month balance
    balances[i] = bal;
  }

  return pastFlows.map((flow, i) => ({
    date: flow.date,
    balance: balances[i],
    balanceUpper: balances[i],
    balanceLower: balances[i],
    investmentValue: 0, // not tracked historically
    income: flow.income,
    expense: flow.expense,
    netFlow: flow.income - flow.expense,
    investmentContribution: 0,
    isForecast: false,
  }));
};

/**
 * Compute future value of an investment with regular monthly contributions.
 *
 * FV = PV * (1+r)^n + PMT * ((1+r)^n - 1) / r
 */
export const computeInvestmentGrowth = (
  initial: number,
  monthlyContrib: number,
  annualRate: number,
  months: number,
): number => {
  const r = annualToMonthlyRate(annualRate);

  if (r === 0) {
    return initial + monthlyContrib * months;
  }

  const compoundFactor = Math.pow(1 + r, months);
  return initial * compoundFactor + monthlyContrib * ((compoundFactor - 1) / r);
};
