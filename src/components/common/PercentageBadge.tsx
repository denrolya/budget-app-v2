import React from 'react';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import cn from 'classnames';

interface Props {
  showIcon?: boolean;
  value: number;
  decimals?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  classNames?: string;
}

const PercentageBadge: React.FC<Props> = ({ showIcon = true, value, decimals = 2, size = 'sm', classNames }) => {
  const isPositive = value >= 0;
  const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;

  return (
    <span
      className={cn(
        'rounded-full font-medium flex items-center',
        {
          'bg-success/20 text-success': isPositive,
          'bg-destructive/20 text-destructive': !isPositive,
          'text-[10px] px-1.5 py-0.5': size === 'xs',
          'text-xs px-2 py-1': size === 'sm',
          'text-sm px-2.5 py-1': size === 'md',
          'text-base px-3 py-1.5': size === 'lg',
        },
        classNames,
      )}
    >
      {showIcon && (
        <Icon
          className={cn('mr-0.5', {
            'h-2 w-2': size === 'xs',
            'h-3 w-3': size === 'sm',
            'h-3.5 w-3.5': size === 'md',
            'h-4 w-4': size === 'lg',
          })}
        />
      )}
      {Math.abs(value).toFixed(decimals)}%
    </span>
  );
};

export default PercentageBadge;
