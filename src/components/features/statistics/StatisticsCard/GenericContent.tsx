import { Moment } from 'moment';
import React from 'react';

import PercentageBadge from '@/components/features/statistics/StatisticsCard/PercentageBadge';
import { ComparisonType, StatisticsType } from '@/types/statistics';
import { Type as TransactionType } from '@/types/transaction';
import { PercentageChange, StatisticsData } from '@/types/valueByPeriodStatistics';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import MoneyValue from '@/components/common/MoneyValue';
import TooltipContent from '@/components/features/statistics/StatisticsCard/TooltipContent';

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
        openDelay={0}
        desktopComponent="hovercard"
        content={
          <TooltipContent
            label="Current Value"
            amount={currentValue as number}
            selectedTimeframe={selectedTimeframe}
            comparisonTimeframe={comparisonTimeframe}
            comparison={comparison}
          />
        }
      >
        <MoneyValue
          className="text-2xl font-bold tracking-tight"
          useColors={false}
          showSign={false}
          amount={currentValue as number}
        />
      </ResponsiveTooltip>
      <PercentageBadge
        decimals={0}
        type={type}
        percentage={percentageChange as number}
      />
    </div>
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">
        vs {comparison === 'previous' ? 'previous' : 'last year'}
      </span>
      <ResponsiveTooltip
        openDelay={0}
        desktopComponent="hovercard"
        content={
          <TooltipContent
            label="Comparison Value"
            amount={comparisonValue as number}
            selectedTimeframe={selectedTimeframe}
            comparisonTimeframe={comparisonTimeframe}
            comparison={comparison}
          />
        }
      >
        <span>
          <MoneyValue className="font-medium" useColors={false} amount={comparisonValue as number} />
        </span>
      </ResponsiveTooltip>
    </div>
  </>
);

export default GenericContent;
