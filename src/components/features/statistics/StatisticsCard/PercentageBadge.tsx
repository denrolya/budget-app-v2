import cn from 'classnames';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import React from 'react';

interface Props {
  percentage: number;
  reverted?: boolean;
}

export const PercentageBadge: React.FC<Props> = ({ percentage, reverted = false }) => (
  <span className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center', {
    'bg-success/20 text-success': (!reverted && percentage >= 100) || (reverted && percentage > 0),
    'bg-destructive/20 text-destructive': (!reverted && percentage < 100) || (reverted && percentage < 0),
  })}>
    {((percentage >= 100 && !reverted) || (reverted && percentage < 0))
      ? <ArrowUpIcon className="h-3 w-3 mr-1" />
      : <ArrowDownIcon className="h-3 w-3 mr-1" />}
    {Math.abs(percentage).toFixed(1)}%
  </span>
);

export default PercentageBadge;
