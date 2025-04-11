import { Moment } from 'moment';
import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import PercentageBadge from '@/components/features/statistics/StatisticsCard/PercentageBadge';
import TooltipContent from '@/components/features/statistics/StatisticsCard/TooltipContent';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ComparisonType, StatisticsType } from '@/types/statistics';
import { Type as TransactionType } from '@/types/transaction';
import { PercentageChange, StatisticsData } from '@/types/valueByPeriodStatistics';

const MinMaxContent: React.FC<{
  currentValue: StatisticsData<StatisticsType.MinMax>;
  comparisonValue: StatisticsData<StatisticsType.MinMax>;
  percentageChange: PercentageChange<StatisticsType.MinMax>;
  selectedTimeframe: { after: Moment; before: Moment };
  comparisonTimeframe: { after: Moment; before: Moment };
  minDate: Moment | undefined;
  maxDate: Moment | undefined;
  comparison: ComparisonType;
  type: TransactionType;
}> = ({
  currentValue,
  comparisonValue,
  percentageChange,
  selectedTimeframe,
  comparisonTimeframe,
  comparison,
  type,
  minDate,
  maxDate,
}) => (
  <div className="flex flex-col space-y-1">
    <div className="flex justify-between items-baseline">
      <ResponsiveTooltip
        openDelay={0}
        desktopComponent="hovercard"
        contentClassName="shadow-lg p-4"
        content={
          <TooltipContent
            label="Minimum Value"
            amount={currentValue.min}
            date={minDate}
            selectedTimeframe={selectedTimeframe}
            comparisonTimeframe={comparisonTimeframe}
            comparison={comparison}
          />
        }
      >
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">Min</span>
          <MoneyValue className="text-lg font-bold" useColors={false} showSign={false} amount={currentValue.min} />
        </div>
      </ResponsiveTooltip>

      <ResponsiveTooltip
        openDelay={0}
        desktopComponent="hovercard"
        contentClassName="shadow-lg p-4"
        content={
          <TooltipContent
            label="Maximum Value"
            amount={currentValue.max}
            date={maxDate}
            selectedTimeframe={selectedTimeframe}
            comparisonTimeframe={comparisonTimeframe}
            comparison={comparison}
          />
        }
      >
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">Max</span>
          <MoneyValue className="text-lg font-bold" useColors={false} showSign={false} amount={currentValue.max} />
        </div>
      </ResponsiveTooltip>
    </div>
    <div className="flex justify-between items-center text-xs">
      <ResponsiveTooltip
        openDelay={0}
        desktopComponent="hovercard"
        contentClassName="shadow-lg p-4"
        content={
          <TooltipContent
            label="Minimum Comparison"
            amount={comparisonValue.min}
            selectedTimeframe={selectedTimeframe}
            comparisonTimeframe={comparisonTimeframe}
            comparison={comparison}
          />
        }
      >
        <PercentageBadge decimals={0} type={type} percentage={percentageChange.min} />
      </ResponsiveTooltip>
      <ResponsiveTooltip
        openDelay={0}
        desktopComponent="hovercard"
        contentClassName="shadow-lg p-4"
        content={
          <TooltipContent
            label="Maximum Comparison"
            amount={comparisonValue.max}
            selectedTimeframe={selectedTimeframe}
            comparisonTimeframe={comparisonTimeframe}
            comparison={comparison}
          />
        }
      >
        <PercentageBadge decimals={0} type={type} percentage={percentageChange.max} />
      </ResponsiveTooltip>
    </div>
  </div>
);

export default MinMaxContent;
