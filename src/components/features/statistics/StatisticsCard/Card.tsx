import MoneyValue from '@/components/common/MoneyValue';
import MenuButton from '@/components/features/statistics/FinancialCardMenuButton';
import PercentageBadge from '@/components/features/statistics/StatisticsCard/PercentageBadge';
import PercentageIndicator from '@/components/features/statistics/StatisticsCard/PercentageIndicator';
import StatTypeBadge from '@/components/features/statistics/StatisticsCard/StatTypeBadge';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Interval } from '@/constants/dashboard-config';
import { CardConfig, useValueByPeriod } from '@/hooks/useValueByPeriodStatistics';
import { Type as TransactionType } from '@/models/Transaction';
import { Moment } from 'moment';
import React, { memo, useMemo } from 'react';

interface Props extends CardConfig {
  onConfigChange: (id: string, newConfig: Partial<CardConfig>) => void;
  after?: Moment;
  before?: Moment;
}

const getPeriodText = (interval: Interval, period?: Interval): string => {
  if (period) {
    return `${interval.value} ${interval.unit}${interval.value > 1 ? 's' : ''} by ${period.value} ${period.unit}${period.value > 1 ? 's' : ''}`;
  }
  switch (interval.unit) {
    case 'day':
      return 'Today';
    case 'week':
      return 'This Week';
    case 'month':
      return 'This Month';
    case 'quarter':
      return 'This Quarter';
    case 'year':
      return 'This Year';
    default:
      return '';
  }
};

const StatisticsCardSkeleton = () => (
  <Card className="w-full sm:min-w-[240px] h-[140px] transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25">
    <CardContent className="p-4">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px] mt-2" />
    </CardContent>
  </Card>
);

const TooltipContent: React.FC<{ label: string; date: Moment | undefined; amount: number }> = ({
                                                                                                 label,
                                                                                                 date,
                                                                                                 amount,
                                                                                               }) => (
  <div className="p-2">
    <p className="font-semibold mb-1">{label}</p>
    <p className="text-sm">{date?.format('MMM D, YYYY')}</p>
    <MoneyValue useColors={false} className="text-lg font-bold mt-1" amount={amount} />
  </div>
);

export const StatisticsCard: React.FC<Props> = memo(({
                                                       id,
                                                       title,
                                                       type,
                                                       categories,
                                                       interval,
                                                       period,
                                                       comparison,
                                                       statType,
                                                       onConfigChange,
                                                       after,
                                                       before,
                                                     }) => {
  const {
    currentValue,
    comparisonValue,
    percentageChange,
    isLoading,
    error,
    minDate,
    maxDate,
  } = useValueByPeriod({
    config: {
      id,
      title,
      type,
      categories,
      interval,
      period,
      comparison,
      statType,
    },
    after,
    before,
  });

  const cardTitle = useMemo(() =>
      title || (categories?.length ? categories.join(', ') : (type === TransactionType.Income ? 'Income' : 'Expenses')),
    [title, categories, type]);

  const periodText = useMemo(() => getPeriodText(interval, period), [interval, period]);

  if (isLoading) {
    return <StatisticsCardSkeleton />;
  }

  return (
    <Card
      className="w-full sm:min-w-[240px] h-[140px] overflow-hidden transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 relative"
      id={id}
    >
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-primary truncate">{cardTitle}</h3>
            <p className="text-xs text-muted-foreground">{periodText}</p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <StatTypeBadge type={statType} />
            <MenuButton
              config={{
                id,
                title,
                type,
                categories,
                interval,
                period,
                comparison,
                statType,
              }}
              onConfigChange={onConfigChange}
            />
          </div>
        </div>
        {error && (
          <p className="text-destructive">Error loading data</p>
        )}
        {!error && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                {(statType === 'min-max') ? (
                  <div className="flex justify-between items-baseline">
                    <ResponsiveTooltip content={
                      <TooltipContent label="Minimum Value" date={minDate} amount={currentValue.min} />
                    }>
                      <MoneyValue
                        className="text-lg font-bold"
                        useColors={false}
                        showSign={false}
                        amount={currentValue.min} />
                    </ResponsiveTooltip>

                    <span className="text-sm text-muted-foreground mx-2">-</span>

                    <ResponsiveTooltip content={
                      <TooltipContent label="Maximum Value" date={maxDate} amount={currentValue.max} />
                    }>
                      <MoneyValue
                        className="text-lg font-bold"
                        useColors={false}
                        showSign={false}
                        amount={currentValue.max} />
                    </ResponsiveTooltip>
                  </div>
                ) : (
                  <>
                    <MoneyValue
                      useColors={false}
                      showSign={false}
                      amount={currentValue}
                      className="text-2xl font-bold tracking-tight" />
                    <PercentageBadge percentage={percentageChange} reverted={type === TransactionType.Expense} />
                  </>
                )}
              </div>
              {(statType === 'min-max') ? (
                <div className="flex flex-col text-xs">
                  <ResponsiveTooltip
                    triggerClassName="flex justify-between items-center"
                    content={
                      <div className="p-2">
                        <p className="font-semibold mb-1">Minimum Comparison</p>
                        <div className="flex justify-between items-center">
                          <span>Current:</span>
                          <MoneyValue amount={currentValue.min} className="font-medium" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Previous:</span>
                          <MoneyValue amount={comparisonValue.min} className="font-medium" />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span>Change:</span>
                          <PercentageBadge percentage={percentageChange.min} reverted />
                        </div>
                      </div>
                    }
                  >
                    <>
                      <span>Min:</span>
                      <PercentageBadge percentage={percentageChange.min} reverted />
                    </>
                  </ResponsiveTooltip>
                  <ResponsiveTooltip
                    triggerClassName="flex justify-between items-center"
                    content={
                      <div className="p-2">
                        <p className="font-semibold mb-1">Maximum Comparison</p>
                        <div className="flex justify-between items-center">
                          <span>Current:</span>
                          <MoneyValue className="font-medium" amount={currentValue.max} />
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Previous:</span>
                          <MoneyValue className="font-medium" amount={comparisonValue.max} />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span>Change:</span>
                          <PercentageBadge reverted percentage={percentageChange.max} />
                        </div>
                      </div>
                    }
                  >
                    <>
                      <span>Max:</span>
                      <PercentageBadge reverted percentage={percentageChange.max} />
                    </>
                  </ResponsiveTooltip>
                </div>
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    vs {comparison === 'previous' ? 'previous' : 'last year'}
                  </span>
                  <MoneyValue useColors={false} className="font-medium" amount={comparisonValue} />
                </div>
              )}
            </div>
            <PercentageIndicator
              currentValue={currentValue}
              previousValue={comparisonValue}
              type={type}
              statType={statType}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
});

StatisticsCard.displayName = 'StatisticsCard';

export default StatisticsCard;
