import { HelpCircle } from 'lucide-react';
import React, { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Separator } from '@/components/ui/separator';

interface SectionProps {
  children: React.ReactNode;
  title: string;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="space-y-1.5">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
    <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5">{children}</div>
  </div>
);

interface MonoProps {
  children: React.ReactNode;
}

const Mono: React.FC<MonoProps> = ({ children }) => <span className="font-mono text-foreground">{children}</span>;

const ForecastInfoDialog: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <ResponsiveTooltip content={<span className="text-xs text-primary-foreground">How this works</span>}>
        <DialogTrigger asChild>
          <button
            aria-label="How forecast works"
            type="button"
            className="h-5 w-5 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </DialogTrigger>
      </ResponsiveTooltip>

      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono uppercase tracking-widest">Forecast — Reference Guide</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* ── What is this ── */}
          <Section title="What is this?">
            <p>
              An interactive <Mono>scenario planner</Mono> for your finances — not a crystal ball. It takes your real
              account balances, actual spending patterns, and investment allocations as a starting point, then projects
              them forward under assumptions you control.
            </p>
            <p>
              This is a <Mono>&quot;what if&quot;</Mono> tool. Change any parameter and see how it shifts your
              trajectory. The model is only as good as the inputs you give it: honest numbers produce useful
              projections, optimistic numbers produce fairy tales.
            </p>
            <p>
              <Mono>Not financial advice.</Mono> This tool cannot account for market crashes, job loss, medical
              emergencies, or any other black swan event. Use it to build intuition about how your decisions compound
              over time — then make your own judgment calls.
            </p>
          </Section>

          <Separator />

          {/* ── How predictions work ── */}
          <Section title="How predictions work">
            <p>
              The forecast analyzes your last 12 months of real income and expense data, then builds a monthly
              prediction. Two modes are available — the active mode is shown as a badge in the header.
            </p>
            <div className="space-y-2 pl-2 border-l-2 border-border">
              <div>
                <p className="font-medium text-foreground">SMART mode (default)</p>
                <p>
                  <Mono>Recency-weighted averages</Mono> — newer months count significantly more than older ones. A
                  raise you got 2 months ago has more influence than spending from a year ago. This means the model
                  adapts to your current financial reality, not your historical average.
                </p>
                <p>
                  <Mono>IQR outlier exclusion</Mono> — unusual one-time spikes (buying a motorcycle, receiving a large
                  gift) are automatically detected and excluded using the interquartile range method. This prevents a
                  single abnormal month from distorting the entire projection.
                </p>
                <p>
                  <Mono>Trend detection</Mono> — compares the average of your last 3 months against your first 3 months.
                  If expenses are trending upward (lifestyle creep) or income is rising (career growth), the projection
                  reflects that trajectory rather than assuming flat averages.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">SIMPLE mode (fallback)</p>
                <p>
                  A flat 12-month arithmetic average with no weighting or outlier removal. Used automatically when there
                  is not enough data for the weighted calculation — typically when you have fewer than 3-4 months of
                  history. As more data accumulates, the system switches to SMART mode.
                </p>
              </div>
            </div>
          </Section>

          <Separator />

          {/* ── The chart ── */}
          <Section title="The chart">
            <p>
              A single <Mono>net worth</Mono> line combining your cash holdings and investment portfolio. The vertical{' '}
              <Mono>&quot;Now&quot;</Mono> divider separates historical data (left, from your real transactions) from
              projected data (right, computed from your scenario parameters).
            </p>
            <p>
              The shaded <Mono>confidence band</Mono> around the projection widens over time. This is intentional —
              uncertainty compounds like a random walk, amplified by inflation. The further out you project, the less
              precise any single-line estimate becomes. The band gives you an honest visual range of outcomes.
            </p>
            <p>
              The <Mono>investment line</Mono> in the forecast zone shows your portfolio growth trajectory separately.
              Watch for the <Mono>crossover marker</Mono> — the point where your annual investment returns exceed your
              annual contributions. This is the moment compounding takes over: your money is making more money than you
              are putting in. Once you cross this threshold, growth accelerates without requiring more effort from you.
            </p>
          </Section>

          <Separator />

          {/* ── Financial Independence ── */}
          <Section title="Financial Independence (FI)">
            <p>
              Based on the <Mono>4% rule</Mono> from the Trinity Study (1998). Researchers analyzed historical
              stock/bond returns and found that withdrawing 4% of your portfolio annually was sustainable for at least
              30 years in virtually all historical periods.
            </p>
            <p>
              The math is simple: <Mono>25 x your annual expenses = FI target portfolio</Mono>. If you spend
              3,000/month, you need 3,000 x 12 x 25 = <Mono>900,000</Mono> invested. At that point, a 4% withdrawal
              covers your living costs, and the remaining portfolio growth keeps pace with inflation.
            </p>
            <p>
              <Mono>When the 4% rule breaks down:</Mono> it was designed for 30-year retirements. If you plan for 50+
              years (early retirement), consider using 3.25-3.5% instead (i.e. 29-31x expenses). It also assumes a
              diversified portfolio — concentrated positions (all in one stock, all in crypto) have much higher failure
              rates. Finally, extended high-inflation environments erode purchasing power faster than the model assumes.
            </p>
            <p>
              The <Mono>FI progress %</Mono> and <Mono>estimated time to FI</Mono> are shown in the strategy panel. Note
              that the FI target is not static — it moves with inflation. As your projected expenses grow over time, so
              does the portfolio needed to sustain them.
            </p>
          </Section>

          <Separator />

          {/* ── Events ── */}
          <Section title="Events">
            <p>Model life changes that the baseline prediction cannot anticipate:</p>
            <div className="space-y-2 pl-2 border-l-2 border-border">
              <div>
                <p className="font-medium text-foreground">One-time events</p>
                <p>
                  A single financial impact in one specific month. Examples: a year-end bonus, selling a car, a large
                  medical bill, receiving an inheritance. The amount hits once and is done.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Recurring events</p>
                <p>
                  A <Mono>permanent monthly change</Mono> from the start date onward. A salary raise of +500/mo starting
                  July means +500 every single month after July — forever. This is where compound effects become
                  dramatic: +500/mo at a 50% savings rate and 7% returns grows to over 100,000 in 10 years. Recurring
                  events also work for modeling new expenses (rent increase, loan repayment, subscription).
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">The invest % field</p>
                <p>
                  For income events, specify what percentage goes directly to your investment portfolio vs. staying as
                  cash. Selling an asset with <Mono>80% invest</Mono> means 80% goes to portfolio, 20% to cash —
                  bypassing your normal savings rate for that event.
                </p>
              </div>
            </div>
            <p>
              <Mono>Strategy tip:</Mono> model both an optimistic and a pessimistic scenario. Use scenario comparison to
              see the gap between them — if both scenarios lead to a good outcome, you can act with confidence.
            </p>
          </Section>

          <Separator />

          {/* ── Sidebar controls ── */}
          <Section title="Sidebar controls">
            <p>
              All values start from your real data. The colored badge next to each input shows how far you have deviated
              from actuals. <Mono>Reset to actuals</Mono> restores everything.
            </p>
            <p>Each parameter has a causal chain. Understanding these chains is key to using the tool effectively:</p>
            <div className="space-y-1 pl-2 border-l-2 border-border">
              <p>
                <Mono>Income</Mono> — higher income increases your monthly surplus, which means more available to
                invest, which accelerates portfolio growth. The effect compounds.
              </p>
              <p>
                <Mono>Expenses</Mono> — lower expenses increase surplus AND reduce your FI target (you need less to
                sustain a cheaper lifestyle). This is a double lever — cutting expenses is often more powerful than
                increasing income for FI planning.
              </p>
              <p>
                <Mono>Savings Rate</Mono> — what % of your surplus goes to investments. The rest stays as cash. A higher
                rate means faster compounding but less cash buffer.
              </p>
              <p>
                <Mono>Return Rate</Mono> — expected annual investment return, compounded monthly. Default 6.6% reflects
                a diversified global ETF portfolio. Conservative: 5%. Aggressive: 8%.
              </p>
              <p>
                <Mono>Balance / Investment Value</Mono> — starting positions. Change to simulate &quot;what if I started
                with more/less.&quot;
              </p>
            </div>
            <p>
              <Mono>Common mistakes:</Mono> setting return rate to 15% (historically unrealistic for diversified
              portfolios — even the S&P 500 averages ~10% nominal, ~7% real). Ignoring inflation entirely. Using a
              savings rate from your best month rather than your actual average.
            </p>
          </Section>

          <Separator />

          {/* ── Income Growth vs Inflation ── */}
          <Section title="Income growth vs inflation">
            <p>
              These are separate parameters because they represent different forces. <Mono>Inflation</Mono> erodes
              purchasing power of all money — your expenses grow, your cash loses value. <Mono>Income growth</Mono> is
              your career trajectory — promotions, raises, job switches.
            </p>
            <p>
              <Mono>Default behavior:</Mono> income grows at the inflation rate (conservative). This means your real
              purchasing power stays flat — you get raises, but they only keep up with rising costs.
            </p>
            <p>
              <Mono>Set income growth higher than inflation</Mono> if you expect career progression — early career
              professionals often see 5-10% annual income growth while inflation runs at 2-3%. This creates a widening
              surplus over time.
            </p>
            <p>
              <Mono>Set income growth lower or to 0%</Mono> for worst-case modeling — stagnant wages while costs rise.
              This is the stress test: if your plan still works with flat income and 3% inflation, it is robust.
            </p>
          </Section>

          <Separator />

          {/* ── Min Cash Reserve ── */}
          <Section title="Min cash reserve">
            <p>
              An <Mono>emergency fund floor</Mono>. When your projected cash balance would drop below this threshold
              (due to expenses exceeding income in a given month), investment contributions are automatically reduced to
              maintain the floor. The system prioritizes keeping you liquid.
            </p>
            <p>
              <Mono>Recommended setting:</Mono> 6x your monthly expenses. If you spend 3,000/month, set the reserve to
              18,000. This gives you six months of runway if income stops — the standard emergency fund recommendation
              from most financial planners.
            </p>
            <p>
              Setting this too high means cash sits idle instead of compounding in investments. Setting it too low means
              any income disruption forces you to liquidate investments at potentially bad prices. The right number
              depends on your income stability — freelancers need more buffer than salaried employees.
            </p>
          </Section>

          <Separator />

          {/* ── Strategy scorecard ── */}
          <Section title="Strategy scorecard">
            <p>
              The bottom panel evaluates your scenario across <Mono>12 rules</Mono> in four categories, producing a{' '}
              <Mono>0-100 score</Mono> and a letter grade:
            </p>
            <div className="space-y-1 pl-2 border-l-2 border-border">
              <p>
                <Mono>Cash Flow</Mono> — savings rate, expense stability, positive surplus
              </p>
              <p>
                <Mono>Safety</Mono> — emergency fund coverage, cash runway, income resilience
              </p>
              <p>
                <Mono>Wealth Building</Mono> — investment rate, compound momentum, FI trajectory
              </p>
              <p>
                <Mono>Risk</Mono> — return rate realism, expense shock buffer, cash drag
              </p>
            </div>
            <p>
              Each rule scores <Mono>pass = 10</Mono>, <Mono>warn = 5</Mono>, or <Mono>fail = 0</Mono> points. Total is
              summed across all 12 rules (max 120), then normalized to 0-100. Grade thresholds: <Mono>A &ge; 85</Mono>,{' '}
              <Mono>B &ge; 70</Mono>, <Mono>C &ge; 55</Mono>, <Mono>D &ge; 40</Mono>, <Mono>F &lt; 40</Mono>.
            </p>
            <p>
              Click the grade bar to expand and see each rule with actionable suggestions for any warn/fail items. Focus
              on <Mono>Cash Flow</Mono> and <Mono>Safety</Mono> rules first — these are foundational. Wealth building
              rules only matter once your cash position is stable.
            </p>
            <p>
              <Mono>Stress tests</Mono> use binary search to find the maximum shock your strategy can absorb. &quot;Exp
              shock +25%&quot; means your finances can handle a 25% expense increase before your cash runway drops below
              the safety threshold. &quot;Income shock -30%&quot; means you can lose 30% of income and still survive.
              Higher numbers = more resilient strategy.
            </p>
          </Section>

          <Separator />

          {/* ── Scenarios ── */}
          <Section title="Scenarios">
            <p>
              Save your current parameter set as a named <Mono>snapshot</Mono>. Load any saved scenario to restore its
              exact parameters. This lets you build a library of plans: &quot;current path&quot;, &quot;aggressive
              saving&quot;, &quot;career change&quot;, &quot;worst case&quot;.
            </p>
            <p>
              <Mono>Comparison mode:</Mono> select a second scenario to overlay its projection line on the same chart.
              The strategy panel shows both scenarios&apos; KPIs side by side, making trade-offs visible at a glance.
              Does the aggressive plan reach FI 5 years sooner? How much riskier is it?
            </p>
            <p>
              Use scenarios to evaluate trade-offs — not to find &quot;the best&quot; answer. There is no single optimal
              strategy because your priorities (speed to FI, cash safety, lifestyle quality) are personal. The tool
              shows consequences; you decide what matters.
            </p>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForecastInfoDialog;
