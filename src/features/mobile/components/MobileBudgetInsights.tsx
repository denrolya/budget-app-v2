import { AlertCircle, ChevronDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import { useList as useCategoryList } from '@/features/categories';
import type { BudgetInsightsResponse } from '@/features/budget/api/types';
import { fmtBudgetAmt } from '@/features/budget/hooks/useBudgetTotals';

interface Props {
  budgetStartDate: string;
  displayCurrency: string;
  insights: BudgetInsightsResponse;
}

const MobileBudgetInsights: React.FC<Props> = ({ displayCurrency, insights }) => {
  const { outliers } = insights;
  const [expanded, setExpanded] = useState(false);
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

  if (outliers.length === 0) return null;

  return (
    <div className="border-b border-border/40">
      <div className="px-3 py-2">
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-medium shrink-0 transition-colors',
            expanded ? 'bg-warning/10 border-warning/30 text-warning' : 'border-border text-muted-foreground',
          )}
          onClick={() => setExpanded((v) => !v)}
        >
          <AlertCircle className="h-3 w-3" />
          {outliers.length} outlier{outliers.length !== 1 ? 's' : ''}
          <ChevronDown className={cn('h-2.5 w-2.5 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {outliers.slice(0, 5).map((item) => (
            <div className="flex items-center justify-between gap-2 text-xs" key={item.transactionId}>
              <span className="truncate min-w-0 text-muted-foreground">
                {categoryMap.get(item.categoryId) ?? 'Unknown'}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-destructive font-medium tabular-nums">
                  {fmtBudgetAmt(item.convertedAmount, displayCurrency)}
                </span>
                <span className="text-warning text-2xs tabular-nums">{item.deviation}x</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileBudgetInsights;
