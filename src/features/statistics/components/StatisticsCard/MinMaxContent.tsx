import { Moment } from 'moment';
import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import PercentageBadge from '@/features/statistics/components/StatisticsCard/PercentageBadge';
import TooltipContent from '@/features/statistics/components/StatisticsCard/TooltipContent';
import { Type as TransactionType } from '@/features/transactions';
import { ComparisonType, StatisticsType } from '@/types/statistics';
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
        desktopComponent="hovercard"
        openDelay={0}
        content={
          <TooltipContent
            amount={currentValue.min}
            comparison={comparison}
            comparisonTimeframe={comparisonTimeframe}
            date={minDate}
            label="Minimum Value"
            selectedTimeframe={selectedTimeframe}
          />
        }
        contentClassName="shadow-lg p-4"
      >
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">Min</span>
          <MoneyValue amount={currentValue.min} showSign={false} useColors={false} className="text-lg font-bold" />
        </div>
      </ResponsiveTooltip>

      <ResponsiveTooltip
        desktopComponent="hovercard"
        openDelay={0}
        content={
          <TooltipContent
            amount={currentValue.max}
            comparison={comparison}
            comparisonTimeframe={comparisonTimeframe}
            date={maxDate}
            label="Maximum Value"
            selectedTimeframe={selectedTimeframe}
          />
        }
        contentClassName="shadow-lg p-4"
      >
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">Max</span>
          <MoneyValue amount={currentValue.max} showSign={false} useColors={false} className="text-lg font-bold" />
        </div>
      </ResponsiveTooltip>
    </div>
    <div className="flex justify-between items-center text-xs">
      <ResponsiveTooltip
        desktopComponent="hovercard"
        openDelay={0}
        content={
          <TooltipContent
            amount={comparisonValue.min}
            comparison={comparison}
            comparisonTimeframe={comparisonTimeframe}
            label="Minimum Comparison"
            selectedTimeframe={selectedTimeframe}
          />
        }
        contentClassName="shadow-lg p-4"
      >
        <PercentageBadge decimals={0} percentage={percentageChange.min} type={type} />
      </ResponsiveTooltip>
      <ResponsiveTooltip
        desktopComponent="hovercard"
        openDelay={0}
        content={
          <TooltipContent
            amount={comparisonValue.max}
            comparison={comparison}
            comparisonTimeframe={comparisonTimeframe}
            label="Maximum Comparison"
            selectedTimeframe={selectedTimeframe}
          />
        }
        contentClassName="shadow-lg p-4"
      >
        <PercentageBadge decimals={0} percentage={percentageChange.max} type={type} />
      </ResponsiveTooltip>
    </div>
  </div>
);

export default MinMaxContent;
