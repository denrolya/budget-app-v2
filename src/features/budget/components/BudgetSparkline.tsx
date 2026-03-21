import React from 'react';

import type { CategoryDayStats } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  data: CategoryDayStats[];
  currency: DisplayCurrency;
}

const W = 56;
const H = 14;

const BudgetSparkline: React.FC<Props> = ({ data, currency }) => {
  const values = data.map((d) => {
    const cv = d.convertedValues[currency];
    return cv ? cv.expense : 0;
  });

  const max = Math.max(...values, 0.01);
  if (values.length < 2) return null;

  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - (v / max) * (H - 1)}`).join(' ');

  return (
    <svg aria-hidden="true" height={H} width={W} className="text-muted-foreground/50">
      <polyline fill="none" points={pts} stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
};

export default BudgetSparkline;
