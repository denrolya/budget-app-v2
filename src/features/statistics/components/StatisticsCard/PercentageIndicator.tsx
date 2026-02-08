import cn from 'classnames';
import React from 'react';

import { StatisticsType } from '@/types/statistics';
import { Type as TransactionType } from '@/features/transactions';

interface Props {
  percentageChange: number | { min: number; max: number };
  type: TransactionType;
  statType: StatisticsType;
}

const getWidth = (percentage: number): string => (percentage >= 0 ? '100%' : `${100 - Math.abs(percentage)}%`);
const getColor = (percentage: number, type: TransactionType): string => {
  if (type === TransactionType.Expense) {
    return percentage >= 0 ? 'bg-destructive' : 'bg-success';
  } else {
    return percentage >= 0 ? 'bg-success' : 'bg-destructive';
  }
};

export const PercentageIndicator: React.FC<Props> = ({ percentageChange, type, statType }) => {
  // Case for single values (not min-max)
  if (typeof percentageChange === 'number') {
    const width = getWidth(percentageChange);
    const color = getColor(percentageChange, type);

    return (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
        <div style={{ width }} className={cn('absolute bottom-0 left-0 h-1', color)} />
      </div>
    );
  }

  // Case for min-max values
  if (statType === 'min-max' && typeof percentageChange === 'object') {
    const minWidth = getWidth(percentageChange.min);
    const maxWidth = getWidth(percentageChange.max);
    const minColor = getColor(percentageChange.min, type);
    const maxColor = getColor(percentageChange.max, type);

    return (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
        <div style={{ width: minWidth }} className={cn('absolute bottom-0 left-0 h-1', minColor)} />
        <div style={{ width: maxWidth }} className={cn('absolute bottom-0 right-0 h-1', maxColor)} />
      </div>
    );
  }

  return null;
};

export default PercentageIndicator;
