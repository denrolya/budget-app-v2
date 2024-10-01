import cn from 'classnames';
import React from 'react';

interface Props {
  currentValue: number | { min: number; max: number };
  previousValue: number | { min: number; max: number };
  type: 'income' | 'expense';
  statType: 'sum' | 'daily' | 'avg' | 'min-max';
}

const calculatePercentage = (current: number, previous: number, type: 'income' | 'expense'): number => {
  if (previous === 0) return current === 0 ? 0 : 100;
  const ratio = (current / previous) * 100;

  if (type === 'expense') {
    return current > previous ? 100 - ratio : ratio;
  } else {
    return current > previous ? ratio - 100 : ratio;
  }
};

const getWidth = (percentage: number): string => `${Math.max(Math.min(percentage, 100), 0)}%`;

const getColor = (current: number, previous: number, type: 'income' | 'expense'): string => {
  if (type === 'expense') {
    return current > previous ? 'bg-destructive' : 'bg-success';
  } else {
    return current > previous ? 'bg-success' : 'bg-destructive';
  }
};

export const PercentageIndicator: React.FC<Props> = ({
                                              currentValue,
                                              previousValue,
                                              type,
                                              statType,
                                            }) => {
  if (typeof currentValue === 'number' && typeof previousValue === 'number') {
    const percentage = calculatePercentage(currentValue, previousValue, type);
    const width = getWidth(percentage);
    const color = getColor(currentValue, previousValue, type);

    return (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
        <div
          className={cn('absolute bottom-0 left-0 h-1', color)}
          style={{ width }}
        />
      </div>
    );
  }

  if (statType === 'min-max' && typeof currentValue === 'object' && typeof previousValue === 'object') {
    const minPercentage = calculatePercentage(currentValue.min, previousValue.min, type);
    const maxPercentage = calculatePercentage(currentValue.max, previousValue.max, type);
    const minWidth = getWidth(minPercentage);
    const maxWidth = getWidth(maxPercentage);
    const minColor = getColor(currentValue.min, previousValue.min, type);
    const maxColor = getColor(currentValue.max, previousValue.max, type);

    return (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
        <div
          className={cn('absolute bottom-0 left-0 h-1', minColor)}
          style={{ width: minWidth }}
        />
        <div
          className={cn('absolute bottom-0 right-0 h-1', maxColor)}
          style={{ width: maxWidth }}
        />
      </div>
    );
  }

  return null;
};

export default PercentageIndicator;
