import { BookOpen } from 'lucide-react';
import React, { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-1.5">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
    <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5">{children}</div>
  </div>
);

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
    <span className="mr-1">{'💡'}</span>
    {children}
  </div>
);

const ForecastGuideDialog: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <ResponsiveTooltip content={<span className="text-xs text-primary-foreground">How to build your model</span>}>
        <DialogTrigger asChild>
          <button
            aria-label="How to build your model"
            type="button"
            className="h-5 w-5 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>
        </DialogTrigger>
      </ResponsiveTooltip>

      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-sm font-mono uppercase tracking-widest">How to Build Your Model</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] px-6 pb-6">
          <div className="space-y-5 pt-3">
            {/* ── 1. The Goal ── */}
            <Section title="The Goal: Honest Self-Assessment">
              <p>
                This tool builds a model of your financial future. A model is only as good as its inputs. The goal is
                NOT to get the highest numbers — it's to build something that reflects your real life, then stress-test
                it.
              </p>
              <p>
                Optimistic inputs produce optimistic fiction. Be honest about what you earn, what you spend, and what
                you're actually willing to save.
              </p>
            </Section>

            {/* ── 2. The Baseline Method ── */}
            <Section title="Step 1: The Baseline Method — Start With Zero Assumptions">
              <p>
                Before touching inflation or income growth, build a <strong>zero-assumption baseline</strong>: set
                inflation to 0% and income growth to 0%. This is the "if absolutely nothing changes" model — your
                current income, current expenses, projected forward with only investment compounding as the variable.
              </p>
              <p>
                If this chart looks wrong, the problem is in your base numbers (income, expenses, balance), not in
                assumptions. Fix those first. If it looks right — you have a trusted foundation.
              </p>
              <Tip>Layer complexity one at a time. Each step should make intuitive sense vs the previous:</Tip>
              <div className="space-y-1 pl-3 border-l-2 border-border">
                <p>
                  <strong>Layer 0:</strong> Inflation 0%, Growth 0% → pure arithmetic. Does the math check out?
                </p>
                <p>
                  <strong>Layer 1:</strong> Add inflation 2.5% → how much does it erode your surplus over time?
                </p>
                <p>
                  <strong>Layer 2:</strong> Add income growth to match → does it cancel out the erosion?
                </p>
                <p>
                  <strong>Layer 3:</strong> Add real events (confirmed raise, planned purchase) → how do they shift the
                  trajectory?
                </p>
                <p>
                  <strong>Layer 4:</strong> Stress test → lower income 20%, raise expenses 15%. Does the model survive?
                </p>
              </div>
              <Tip>
                Save each layer as a separate scenario. "Baseline (0/0)", "With inflation", "With raise" — comparing
                them side-by-side reveals exactly what each assumption costs or gains you.
              </Tip>
            </Section>

            {/* ── 2b. Start With Defaults ── */}
            <Section title="Step 2: Check Your Defaults">
              <p>
                The forecast page loads your real data automatically — weighted average income, expenses, and current
                balances. Before changing anything, ask yourself: do these numbers feel right?
              </p>
              <p>
                If income looks too high, you might have a one-off bonus inflating the average. If expenses look low,
                check if annual costs (insurance, subscriptions, car maintenance) are captured. Switch the analysis
                window (3m/6m/12m/24m) to see how different time ranges affect your averages.
              </p>
            </Section>

            {/* ── 3. Calibrate Income ── */}
            <Section title="Step 3: Calibrate Your Income">
              <p>
                Don't assume future raises. Use what you earn today as the baseline. If you have variable income
                (freelance, commissions), the weighted average already gives more weight to recent months.
              </p>
              <p>
                <strong>For salaried workers:</strong> set income growth to <strong>0%</strong>. Your salary is fixed
                until someone tells you otherwise. Model confirmed raises as recurring events with a start date — not as
                a growth percentage. A growth rate implies predictable annual increases, which most salaried positions
                don't guarantee.
              </p>
              <Tip>
                Only add income events for changes you have hard confirmation for — signed contract, scheduled raise,
                confirmed bonus. "I might get promoted" is not a confirmed change.
              </Tip>
            </Section>

            {/* ── 4. Expenses ── */}
            <Section title="Step 4: Think Hard About Expenses">
              <p>
                Monthly averages hide annual costs: insurance premiums, car registration, medical checkups, yearly
                subscriptions. Look at your seasonal pattern — if December expenses are 40% above average, that's real
                spending, not an anomaly.
              </p>
              <p>
                Don't assume expenses will decrease. They rarely do. If you're planning a specific future expense
                (moving, medical procedure, renovation), add it as an event.
              </p>
              <p>
                <strong>Inflation setting:</strong> for EUR, the ECB targets 2% and the 10-year average is roughly 2.5%.
                Use <strong>2.5%</strong> as a safe conservative default. The 2022-2023 spike (8-10%) was exceptional,
                not the norm. Your real investment return = nominal return minus inflation (e.g., 6.6% − 2.5% = 4.1%
                real growth).
              </p>
            </Section>

            {/* ── 5. Savings Rate ── */}
            <Section title="Step 5: Set a Realistic Savings Rate">
              <p>
                The default savings rate is computed from your actual surplus over 12 months. If it seems high, you
                might have one-off income inflating it. A realistic savings rate is one you can maintain for years, not
                one you achieved during your best month.
              </p>
              <Tip>
                For most people, 15-25% is excellent. 30%+ requires significant discipline. 50%+ means you're either
                very high income or very low expense — make sure it's sustainable.
              </Tip>
            </Section>

            {/* ── 6. Investment Returns ── */}
            <Section title="Step 6: Investment Returns — Be Conservative">
              <p>
                The default 6.6% assumes a diversified ETF portfolio. This is already a long-term average — some years
                will be -20%, others +30%. Don't set this to 12-15% hoping for the best.
              </p>
              <p>
                Historical averages: S&P 500 ~10% nominal (~7% real), bonds ~4-5%, blended portfolio ~6-8%. If you're
                mostly in crypto or individual stocks, your variance is much higher and averages are less reliable.
              </p>
            </Section>

            {/* ── 7. Real Plans ── */}
            <Section title="Step 7: Model Real Plans, Not Fantasies">
              <p>
                Events should represent commitments or high-probability changes. A salary raise you've been promised in
                writing? Add it. "What if I start a side business making 2000/month?" — that's a scenario to explore,
                not a baseline plan.
              </p>
              <Tip>
                Use the scenario comparison feature for what-if exploration. Keep your main scenario grounded in
                reality. Save the optimistic version as a separate scenario named "best case."
              </Tip>
            </Section>

            {/* ── 8. Stress Test ── */}
            <Section title="Step 8: Stress Test Your Model">
              <p>
                Once your baseline feels honest, break it. Lower income by 20% — does the grade hold? Raise expenses by
                15% — how many months of runway do you lose?
              </p>
              <p>
                The Expense Shock and Income Loss tolerances in the scorecard tell you this automatically, but manually
                testing builds intuition. If a 10% income drop makes your model collapse, your strategy is fragile.
              </p>
            </Section>

            {/* ── 9. Save and Revisit ── */}
            <Section title="Step 9: Save and Revisit">
              <p>
                Export your baseline scenario. Come back every month. Import it. Compare what your model predicted vs
                what actually happened.
              </p>
              <Tip>
                The gap between model and reality is the most valuable data point — it tells you where your assumptions
                are wrong. Over time, your model gets more accurate because you've calibrated it against real life.
              </Tip>
            </Section>

            {/* ── 10. What to Focus On ── */}
            <Section title="What to Focus On">
              <div className="space-y-2 pl-2 border-l-2 border-border">
                <div>
                  <p className="font-medium text-foreground">Short horizon (1-2y)</p>
                  <p>
                    Focus on savings rate, cash buffer, and expense control. FI and yield are irrelevant at this scale.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Medium horizon (5-10y)</p>
                  <p>Focus on investment discipline and the crossover point. Start watching compound momentum.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Long horizon (15-30y)</p>
                  <p>
                    FI becomes meaningful. Small differences in savings rate compound massively. A 5% savings rate
                    increase today can cut years off your FI timeline.
                  </p>
                </div>
              </div>
              <Tip>Don't chase a perfect grade. B is excellent for most people. Consistent B beats occasional A.</Tip>
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ForecastGuideDialog;
