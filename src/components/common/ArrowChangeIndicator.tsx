import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import React from 'react';
import cn from 'classnames';

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  invert?: boolean;
}

const ArrowChangeIndicator: React.FC<Props> = ({ value, invert = false, className, ...rest }) => {
  if (value === 0) return null;

  const Icon = value >= 0 !== invert ? ArrowUpIcon : ArrowDownIcon;

  return (
    <span className={cn('inline-flex items-center', className)} {...rest}>
      <Icon className="h-4 w-4" />
    </span>
  );
};

export default ArrowChangeIndicator;
