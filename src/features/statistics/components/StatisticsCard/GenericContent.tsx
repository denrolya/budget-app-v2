import { Moment } from 'moment';
import React from 'react';

import { ComparisonType, StatisticsType } from '@/types/statistics';
import { Type as TransactionType } from '@/types/transaction';
import { PercentageChange, StatisticsData } from '@/types/valueByPeriodStatistics';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import MoneyValue from '@/components/common/MoneyValue';
import PercentageBadge from '@/features/statistics/components/StatisticsCard/PercentageBadge';
import TooltipContent from '@/features/statistics/components/StatisticsCard/TooltipContent';

const GenericContent: React.FC<{
  currentValue: StatisticsData<StatisticsType.Sum>;
  comparisonValue: StatisticsData<StatisticsType.Sum>;
  percentageChange: PercentageChange<StatisticsType.Sum>;
  selectedTimeframe: { after: Moment; before: Moment };
  comparisonTimeframe: { after: Moment; before: Moment };
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
}) => (
  <>
    <div className="flex justify-between items-baseline">
      <ResponsiveTooltip
        desktopComponent="hovercard"
        openDelay={0}
        content={
          <TooltipContent
            amount={currentValue as number}
            comparison={comparison}
            comparisonTimeframe={comparisonTimeframe}
            label="Current Value"
            selectedTimeframe={selectedTimeframe}
          />
        }
        contentClassName="p-2 rounded-xl text-xs"
      >
        <MoneyValue
          amount={currentValue as number}
          showSign={false}
          useColors={false}
          className="text-2xl font-bold tracking-tight"
        />
      </ResponsiveTooltip>
      <PercentageBadge decimals={0} percentage={percentageChange as number} type={type} />
    </div>
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground text-xs">vs {comparison === 'previous' ? 'previous' : 'last year'}</span>
      <ResponsiveTooltip
        desktopComponent="hovercard"
        openDelay={0}
        content={
          <TooltipContent
            amount={comparisonValue as number}
            comparison={comparison}
            comparisonTimeframe={comparisonTimeframe}
            label="Comparison Value"
            selectedTimeframe={selectedTimeframe}
          />
        }
        contentClassName="p-2 rounded-xl text-xs"
      >
          <MoneyValue amount={comparisonValue as number} useColors={false} className="font-semibold text-xs" />
      </ResponsiveTooltip>
    </div>
  </>
);

export default GenericContent;
