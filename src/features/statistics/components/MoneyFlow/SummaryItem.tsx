import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { cn } from '@/lib/utils';
import ResponsiveTooltip from '@/components/ui/responsive-tooltip';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  label: string;
  value: number;
  colors?: boolean;
  showSign?: boolean;
  comparisonValue?: number;
  comparisonPercentage?: number;
}

const SummaryItem: React.FC<Props> = ({
  label,
  colors = false,
  showSign = false,
  value,
  comparisonValue,
  comparisonPercentage,
  ...props
}) => (
  <div {...props}>
    <p className="text-muted-foreground flex items-center justify-start md:justify-center text-xs">{label}</p>
    <div className="flex items-center justify-start md:justify-center">
      <MoneyValue className="font-medium font-mono text-xs" useColors={colors} showSign={showSign} amount={value} />
      {comparisonValue != null && comparisonPercentage != null && (
        <ResponsiveTooltip
          content={
            <span className="flex items-center text-xs">
              vs
              <MoneyValue
                className="ml-1 font-medium font-mono"
                useColors={colors}
                showSign={showSign}
                amount={comparisonValue}
              />
            </span>
          }
        >
          <div
            className={cn('ml-2 text-xs flex items-center font-mono cursor-help', {
              'text-success': comparisonPercentage >= 0,
              'text-destructive': comparisonPercentage < 0,
            })}
          >
            {comparisonPercentage >= 0 ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />}
            <span className="ml-1">{Math.abs(comparisonPercentage).toFixed()}%</span>
          </div>
        </ResponsiveTooltip>
      )}
    </div>
  </div>
);

export default SummaryItem;
