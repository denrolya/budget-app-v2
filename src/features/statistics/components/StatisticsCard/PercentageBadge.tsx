import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import React from 'react';

import { Type as TransactionType } from '@/features/transactions';

interface Props {
  percentage: number;
  type: TransactionType;
  decimals?: number;
}

export const PercentageBadge: React.FC<Props> = ({ percentage, type, decimals = 1 }) => {
  const isIncrease = percentage >= 0;
  const Icon = isIncrease ? ArrowUpIcon : ArrowDownIcon;

  return (
    <span
      className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center', {
        'bg-destructive/20 text-destructive':
          (type === TransactionType.Expense && isIncrease) || (type === TransactionType.Income && !isIncrease),
        'bg-success/20 text-success':
          (type === TransactionType.Expense && !isIncrease) || (type === TransactionType.Income && isIncrease),
      })}
    >
      <Icon className="mr-1 h-3 w-3" />
      {Math.abs(percentage).toFixed(decimals)}%
    </span>
  );
};

export default PercentageBadge;
