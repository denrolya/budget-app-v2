import { AlertCircle, Calendar, ChevronDown, ChevronUp, TrendingDown, TrendingUp } from 'lucide-react';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { useList as useCategoryList } from '@/features/categories';

import type { BudgetInsightsResponse, CategoryTrendItem, OutlierItem, SeasonalItem } from '../api/types';

interface Props {
  insights: BudgetInsightsResponse;
  displayCurrency: string;
  budgetStartDate: string;
}

const OUTLIER_INITIAL_VISIBLE = 5;

const fmtAmt = (amount: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

// ── Sub-section toggle header ───────────────────────────────────────────────

interface SectionHeaderProps {
  children: React.ReactNode;
  count: number;
  expanded: boolean;
  icon: React.ReactNode;
  onToggle: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ children, count, expanded, icon, onToggle }) => (
  <button
    type="button"
    className="w-full flex items-center justify-between gap-1.5 font-medium text-xs hover:opacity-80 transition-opacity"
    onClick={onToggle}
  >
    <span className="flex items-center gap-1.5">
      {icon}
      {children} ({count})
    </span>
    {expanded ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
  </button>
);

// ── Outliers sub-section ────────────────────────────────────────────────────

const OutliersSection: React.FC<{ displayCurrency: string; outliers: OutlierItem[] }> = ({
  displayCurrency,
  outliers,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

  const visibleOutliers = showAll ? outliers : outliers.slice(0, OUTLIER_INITIAL_VISIBLE);
  const hasMore = outliers.length > OUTLIER_INITIAL_VISIBLE;

  return (
    <div>
      <SectionHeader
        count={outliers.length}
        expanded={expanded}
        icon={<AlertCircle className="h-3.5 w-3.5 text-warning" />}
        onToggle={() => setExpanded((value) => !value)}
      >
        <span className="text-warning">Unusual transactions</span>
      </SectionHeader>

      {expanded && (
        <div className="mt-1.5 space-y-1">
          {visibleOutliers.map((outlier) => (
            <div className="flex items-center gap-2 text-xs py-0.5" key={outlier.transactionId}>
              <span className="text-muted-foreground truncate min-w-0 max-w-[120px]">
                {categoryMap.get(outlier.categoryId) ?? 'Unknown'}
              </span>
              <span className="truncate min-w-0 flex-1 text-muted-foreground/70">
                {outlier.note ?? moment(outlier.executedAt).format('MMM D')}
              </span>
              <span className="text-destructive font-medium tabular-nums shrink-0">
                {fmtAmt(outlier.convertedAmount, displayCurrency)}
              </span>
              <span className="text-warning font-medium tabular-nums shrink-0 text-2xs">
                {outlier.deviation}x median
              </span>
            </div>
          ))}
          {hasMore && (
            <button
              type="button"
              className="text-2xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? 'show less' : `+${outliers.length - OUTLIER_INITIAL_VISIBLE} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Trends sub-section ──────────────────────────────────────────────────────

const TrendsSection: React.FC<{ displayCurrency: string; trends: CategoryTrendItem[] }> = ({
  displayCurrency,
  trends,
}) => {
  const [expanded, setExpanded] = useState(true);
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

  return (
    <div>
      <SectionHeader
        count={trends.length}
        expanded={expanded}
        icon={<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />}
        onToggle={() => setExpanded((value) => !value)}
      >
        Spending trends
      </SectionHeader>

      {expanded && (
        <div className="mt-1.5 space-y-1">
          {trends.map((trend) => {
            const isUp = trend.direction === 'up';
            const TrendIcon = isUp ? TrendingUp : TrendingDown;
            // For expenses: up = bad (destructive), down = good (success)
            const colorClass = isUp ? 'text-destructive' : 'text-success';

            return (
              <div className="flex items-center gap-2 text-xs py-0.5" key={trend.categoryId}>
                <TrendIcon className={cn('h-3 w-3 shrink-0', colorClass)} />
                <span className="truncate min-w-0 flex-1">
                  {categoryMap.get(trend.categoryId) ?? 'Unknown'}
                </span>
                <span className={cn('font-medium tabular-nums shrink-0', colorClass)}>
                  {isUp ? '+' : ''}
                  {trend.changePercent}%
                </span>
                <span className="text-2xs text-muted-foreground tabular-nums shrink-0">
                  {fmtAmt(trend.olderAverage, displayCurrency)} → {fmtAmt(trend.recentAverage, displayCurrency)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Seasonal sub-section ────────────────────────────────────────────────────

const SeasonalSection: React.FC<{ budgetMonth: string; seasonal: SeasonalItem[] }> = ({ budgetMonth, seasonal }) => {
  const [expanded, setExpanded] = useState(true);
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

  return (
    <div>
      <SectionHeader
        count={seasonal.length}
        expanded={expanded}
        icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />}
        onToggle={() => setExpanded((value) => !value)}
      >
        Seasonal patterns
      </SectionHeader>

      {expanded && (
        <div className="mt-1.5 space-y-1">
          {seasonal.map((item) => {
            const isHigh = item.seasonalFactor > 1.0;
            const colorClass = isHigh ? 'text-warning' : 'text-success';
            const label = isHigh ? `${item.seasonalFactor}x typical` : `${item.seasonalFactor}x typical`;

            return (
              <div className="flex items-center gap-2 text-xs py-0.5" key={item.categoryId}>
                <span className="truncate min-w-0 flex-1">
                  {categoryMap.get(item.categoryId) ?? 'Unknown'}
                </span>
                <span className={cn('font-medium tabular-nums shrink-0', colorClass)}>
                  {budgetMonth}: {label}
                </span>
                <span className="text-2xs text-muted-foreground tabular-nums shrink-0">
                  ({item.sampleYears}yr{item.sampleYears > 1 ? 's' : ''} data)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

const BudgetInsightsSection: React.FC<Props> = ({ insights, displayCurrency, budgetStartDate }) => {
  const { outliers, trends, seasonal } = insights;
  const totalCount = outliers.length + trends.length + seasonal.length;

  if (totalCount === 0) return null;

  const budgetMonth = moment(budgetStartDate).format('MMM');

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3 text-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Budget Insights</div>

      {outliers.length > 0 && <OutliersSection displayCurrency={displayCurrency} outliers={outliers} />}

      {trends.length > 0 && outliers.length > 0 && <div className="border-t border-border/40" />}
      {trends.length > 0 && <TrendsSection displayCurrency={displayCurrency} trends={trends} />}

      {seasonal.length > 0 && (outliers.length > 0 || trends.length > 0) && (
        <div className="border-t border-border/40" />
      )}
      {seasonal.length > 0 && <SeasonalSection budgetMonth={budgetMonth} seasonal={seasonal} />}
    </div>
  );
};

export default BudgetInsightsSection;
