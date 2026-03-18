import { AlertCircle, Calendar, ChevronDown, TrendingDown, TrendingUp } from 'lucide-react';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { useList as useCategoryList } from '@/features/categories';
import type { BudgetInsightsResponse } from '@/features/budget/api/types';

interface Props {
  budgetStartDate: string;
  displayCurrency: string;
  insights: BudgetInsightsResponse;
}

const fmtAmt = (amount: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

type SectionType = 'outliers' | 'trends' | 'seasonal';

const MobileBudgetInsights: React.FC<Props> = ({ budgetStartDate, displayCurrency, insights }) => {
  const { outliers, trends, seasonal } = insights;
  const [expanded, setExpanded] = useState<SectionType | null>(null);
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

  const totalCount = outliers.length + trends.length + seasonal.length;
  if (totalCount === 0) return null;

  const budgetMonth = moment(budgetStartDate).format('MMM');

  const toggle = (section: SectionType) => {
    setExpanded((current) => (current === section ? null : section));
  };

  return (
    <div className="border-b border-border/40">
      {/* Summary badges */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto">
        {outliers.length > 0 && (
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-medium shrink-0 transition-colors',
              expanded === 'outliers' ? 'bg-warning/10 border-warning/30 text-warning' : 'border-border text-muted-foreground',
            )}
            onClick={() => toggle('outliers')}
          >
            <AlertCircle className="h-3 w-3" />
            {outliers.length} outlier{outliers.length !== 1 ? 's' : ''}
            <ChevronDown className={cn('h-2.5 w-2.5 transition-transform', expanded === 'outliers' && 'rotate-180')} />
          </button>
        )}
        {trends.length > 0 && (
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-medium shrink-0 transition-colors',
              expanded === 'trends' ? 'bg-muted border-border text-foreground' : 'border-border text-muted-foreground',
            )}
            onClick={() => toggle('trends')}
          >
            <TrendingUp className="h-3 w-3" />
            {trends.length} trend{trends.length !== 1 ? 's' : ''}
            <ChevronDown className={cn('h-2.5 w-2.5 transition-transform', expanded === 'trends' && 'rotate-180')} />
          </button>
        )}
        {seasonal.length > 0 && (
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-medium shrink-0 transition-colors',
              expanded === 'seasonal' ? 'bg-muted border-border text-foreground' : 'border-border text-muted-foreground',
            )}
            onClick={() => toggle('seasonal')}
          >
            <Calendar className="h-3 w-3" />
            {seasonal.length} seasonal
            <ChevronDown className={cn('h-2.5 w-2.5 transition-transform', expanded === 'seasonal' && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded === 'outliers' && (
        <div className="px-3 pb-2 space-y-1">
          {outliers.slice(0, 5).map((item) => (
            <div className="flex items-center justify-between gap-2 text-xs" key={item.transactionId}>
              <span className="truncate min-w-0 text-muted-foreground">
                {categoryMap.get(item.categoryId) ?? 'Unknown'}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-destructive font-medium tabular-nums">
                  {fmtAmt(item.convertedAmount, displayCurrency)}
                </span>
                <span className="text-warning text-2xs tabular-nums">{item.deviation}x</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded === 'trends' && (
        <div className="px-3 pb-2 space-y-1">
          {trends.map((item) => {
            const isUp = item.direction === 'up';
            const TrendIcon = isUp ? TrendingUp : TrendingDown;
            const colorClass = isUp ? 'text-destructive' : 'text-success';
            return (
              <div className="flex items-center justify-between gap-2 text-xs" key={item.categoryId}>
                <span className="truncate min-w-0">{categoryMap.get(item.categoryId) ?? 'Unknown'}</span>
                <span className={cn('inline-flex items-center gap-0.5 font-medium tabular-nums shrink-0', colorClass)}>
                  <TrendIcon className="h-3 w-3" />
                  {isUp ? '+' : ''}{item.changePercent}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {expanded === 'seasonal' && (
        <div className="px-3 pb-2 space-y-1">
          {seasonal.map((item) => {
            const colorClass = item.seasonalFactor > 1.0 ? 'text-warning' : 'text-success';
            return (
              <div className="flex items-center justify-between gap-2 text-xs" key={item.categoryId}>
                <span className="truncate min-w-0">{categoryMap.get(item.categoryId) ?? 'Unknown'}</span>
                <span className={cn('font-medium tabular-nums shrink-0', colorClass)}>
                  {budgetMonth}: {item.seasonalFactor}x typical
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileBudgetInsights;
