import { Info } from 'lucide-react';
import moment from 'moment';
import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { useList as useCategoryList } from '@/features/categories';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { BudgetInsightsResponse, CategoryTrendItem, OutlierItem, SeasonalItem } from '../api/types';

interface Props {
  budgetStartDate: string;
  displayCurrency: string;
  insights: BudgetInsightsResponse;
}

const fmtAmt = (amount: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const fmtPct = (n: number) => `${n > 0 ? '+' : ''}${n}%`;

// ── Outliers column ──────────────────────────────────────────────────────────

const OutliersColumn: React.FC<{ displayCurrency: string; outliers: OutlierItem[] }> = ({
  displayCurrency,
  outliers,
}) => {
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<number, OutlierItem[]>();
    for (const outlier of outliers) {
      const existing = map.get(outlier.categoryId) ?? [];
      existing.push(outlier);
      map.set(outlier.categoryId, existing);
    }
    return [...map.entries()].sort(([idA], [idB]) =>
      (categoryMap.get(idA) ?? '').localeCompare(categoryMap.get(idB) ?? ''),
    );
  }, [outliers, categoryMap]);

  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Outliers ({outliers.length})
      </div>
      <div className="space-y-1">
        {grouped.map(([categoryId, items]) => (
          <div key={categoryId}>
            <div className="text-2xs text-muted-foreground/60 mb-0.5">{categoryMap.get(categoryId) ?? 'Unknown'}</div>
            {items.map((outlier) => (
              <div className="flex items-center gap-1 text-xs py-px pl-2" key={outlier.transactionId}>
                <span className="truncate min-w-0 flex-1 text-muted-foreground">
                  {outlier.note ?? moment(outlier.executedAt).format('MMM D')}
                </span>
                <span className="text-destructive font-medium tabular-nums shrink-0">
                  {fmtAmt(outlier.convertedAmount, displayCurrency)}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-warning/70 text-2xs tabular-nums shrink-0 cursor-help">
                      {outlier.deviation}x
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs p-2.5 tabular-nums">
                    <table className="border-collapse">
                      <tbody>
                        <tr>
                          <td className="pr-3 text-muted-foreground">Amount</td>
                          <td className="text-right">{fmtAmt(outlier.convertedAmount, displayCurrency)}</td>
                        </tr>
                        <tr>
                          <td className="pr-3 text-muted-foreground">Category median</td>
                          <td className="text-right">{fmtAmt(outlier.median, displayCurrency)}</td>
                        </tr>
                        <tr>
                          <td className="pr-3 text-muted-foreground">Deviation</td>
                          <td className="text-right text-warning">{outlier.deviation}x above median</td>
                        </tr>
                      </tbody>
                    </table>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Trends column ────────────────────────────────────────────────────────────

const TrendsColumn: React.FC<{ displayCurrency: string; trends: CategoryTrendItem[] }> = ({
  displayCurrency,
  trends,
}) => {
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Trends ({trends.length})
      </div>
      <div className="space-y-0.5">
        {trends.map((trend) => {
          const isUp = trend.direction === 'up';
          const colorClass = isUp ? 'text-destructive' : 'text-success';

          return (
            <div key={trend.categoryId}>
              {/* Root trend */}
              <div className="flex items-center gap-1 text-xs py-px">
                <span className="truncate min-w-0 flex-1 font-medium">
                  {categoryMap.get(trend.categoryId) ?? 'Unknown'}
                </span>
                <span className={cn('tabular-nums shrink-0 font-medium text-2xs', colorClass)}>
                  {fmtPct(trend.changePercent)}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
                    >
                      <Info className="h-2.5 w-2.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs p-2.5 tabular-nums">
                    <table className="border-collapse">
                      <tbody>
                        <tr>
                          <td className="pr-3 text-muted-foreground">Prior 3mo avg</td>
                          <td className="text-right">{fmtAmt(trend.olderAverage, displayCurrency)}/mo</td>
                        </tr>
                        <tr>
                          <td className="pr-3 text-muted-foreground">Recent 3mo avg</td>
                          <td className="text-right">{fmtAmt(trend.recentAverage, displayCurrency)}/mo</td>
                        </tr>
                        <tr className="border-t border-border/40">
                          <td className="pr-3 pt-1 text-muted-foreground">Change</td>
                          <td className={cn('text-right pt-1 font-medium', colorClass)}>
                            {fmtPct(trend.changePercent)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Child trends */}
              {trend.children?.map((child) => {
                const childUp = child.direction === 'up';
                const childColor = childUp ? 'text-destructive' : 'text-success';
                return (
                  <div className="flex items-center gap-1 text-xs py-px pl-2" key={child.categoryId}>
                    <span className="truncate min-w-0 flex-1 text-muted-foreground">
                      {categoryMap.get(child.categoryId) ?? 'Unknown'}
                    </span>
                    <span className={cn('tabular-nums shrink-0 text-2xs', childColor)}>
                      {fmtPct(child.changePercent)}
                    </span>
                    <span className="w-[14px] shrink-0" />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Seasonal column ──────────────────────────────────────────────────────────

const SeasonalColumn: React.FC<{
  budgetMonth: string;
  displayCurrency: string;
  seasonal: SeasonalItem[];
}> = ({ budgetMonth, displayCurrency, seasonal }) => {
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {budgetMonth} Seasonal ({seasonal.length})
      </div>
      <div className="space-y-0.5">
        {seasonal.map((item) => {
          const isHigh = item.seasonalFactor > 1.0;
          const colorClass = isHigh ? 'text-warning' : 'text-success';

          return (
            <div key={item.categoryId}>
              <div className="flex items-center gap-1 text-xs py-px">
                <span className="truncate min-w-0 flex-1 font-medium">
                  {categoryMap.get(item.categoryId) ?? 'Unknown'}
                </span>
                <span className={cn('tabular-nums shrink-0 font-medium text-2xs', colorClass)}>
                  {item.seasonalFactor}x
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
                    >
                      <Info className="h-2.5 w-2.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs p-2.5 tabular-nums">
                    <table className="border-collapse">
                      <tbody>
                        <tr>
                          <td className="pr-3 text-muted-foreground">{budgetMonth} avg</td>
                          <td className="text-right">{fmtAmt(item.currentMonthHistoricalAverage, displayCurrency)}</td>
                        </tr>
                        <tr>
                          <td className="pr-3 text-muted-foreground">Overall avg</td>
                          <td className="text-right">{fmtAmt(item.overallMonthlyAverage, displayCurrency)}</td>
                        </tr>
                        <tr className="border-t border-border/40">
                          <td className="pr-3 pt-1 text-muted-foreground">Factor</td>
                          <td className={cn('text-right pt-1 font-medium', colorClass)}>{item.seasonalFactor}x</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-muted-foreground mt-1">{item.sampleYears}yr of data</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {item.children?.map((child) => {
                const childHigh = child.seasonalFactor > 1.0;
                const childColor = childHigh ? 'text-warning' : 'text-success';
                return (
                  <div className="flex items-center gap-1 text-xs py-px pl-2" key={child.categoryId}>
                    <span className="truncate min-w-0 flex-1 text-muted-foreground">
                      {categoryMap.get(child.categoryId) ?? 'Unknown'}
                    </span>
                    <span className={cn('tabular-nums shrink-0 text-2xs', childColor)}>{child.seasonalFactor}x</span>
                    <span className="w-[14px] shrink-0" />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

const BudgetInsightsSection: React.FC<Props> = ({ insights, displayCurrency, budgetStartDate }) => {
  const { outliers, trends, seasonal } = insights;
  const totalCount = outliers.length + trends.length + seasonal.length;

  if (totalCount === 0) return null;

  const budgetMonth = moment(budgetStartDate).format('MMM');
  const hasOutliers = outliers.length > 0;
  const hasTrends = trends.length > 0;
  const hasSeasonal = seasonal.length > 0;
  const sectionCount = [hasOutliers, hasTrends, hasSeasonal].filter(Boolean).length;

  // Dynamic grid: 1 section = full width, 2 = 2-col, 3 = 3-col
  const gridClass =
    sectionCount === 1
      ? 'grid-cols-1'
      : sectionCount === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="rounded-lg border bg-card text-sm">
      {/* Header */}
      <div className="flex items-center px-3 py-1.5 border-b border-border/40">
        <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Insights</span>
        <span className="ml-auto text-2xs text-muted-foreground tabular-nums">6mo lookback · {displayCurrency}</span>
      </div>

      {/* 3-column grid */}
      <div className={cn('grid gap-0 divide-y md:divide-y-0 md:divide-x divide-border/30', gridClass)}>
        {hasOutliers && (
          <div className="px-3 py-2">
            <OutliersColumn displayCurrency={displayCurrency} outliers={outliers} />
          </div>
        )}
        {hasTrends && (
          <div className="px-3 py-2">
            <TrendsColumn displayCurrency={displayCurrency} trends={trends} />
          </div>
        )}
        {hasSeasonal && (
          <div className="px-3 py-2">
            <SeasonalColumn budgetMonth={budgetMonth} displayCurrency={displayCurrency} seasonal={seasonal} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetInsightsSection;
