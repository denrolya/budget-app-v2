import { SettingsIcon } from 'lucide-react';
import { Moment } from 'moment';
import React, { memo, useMemo, useState } from 'react';

import PercentageIndicator from '@/components/features/statistics/StatisticsCard/PercentageIndicator';
import MoneyValue from '@/components/common/MoneyValue';
import ConfigForm from '@/components/features/statistics/StatisticsCard/ConfigForm';
import PercentageBadge from '@/components/features/statistics/StatisticsCard/PercentageBadge';
import StatTypeBadge from '@/components/features/statistics/StatisticsCard/StatTypeBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Interval } from '@/constants/dashboard-config';
import { CardConfig, useValueByPeriod } from '@/hooks/statistics/useValueByPeriodStatistics';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Type as TransactionType } from '@/models/Transaction';
import { generateSlug } from '@/utils/generateSlug';

interface Props {
  onChange: (index: number, newConfig: Partial<CardConfig>) => void;
  config: CardConfig;
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

const TooltipContent: React.FC<{ label: string; date: Moment | undefined; amount: number }> = ({ label, date, amount }) => (
  <div className="p-2">
    <p className="font-semibold mb-1">{label}</p>
    <p className="text-sm">{date?.format('MMM D, YYYY')}</p>
    <MoneyValue className="text-lg font-bold mt-1" useColors={false} amount={amount} />
  </div>
);

export const StatisticsCard: React.FC<Props> = ({ config, onChange }) => {
  const { title, type, categories, interval, period, comparison, statType } = config;
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
      title,
      type,
      categories,
      interval,
      period,
      comparison,
      statType,
    },
  }, [title, type, categories, interval, period, comparison, statType]);

  const id = useMemo(() => generateSlug([title, type, statType, comparison]), [title, type, statType, comparison]);

  const cardTitle = useMemo(() =>
      title || (categories?.length ? categories.join(', ') : (type === TransactionType.Income ? 'Income' : 'Expenses')),
    [title, categories, type]);

  const periodText = useMemo(() => getPeriodText(interval, period), [interval, period]);
  const [open, setOpen] = useState(false);
  const isDesktop = useScreenSize();

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
            {isDesktop ? (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <SettingsIcon className="h-4 w-4" />
                    <span className="sr-only">Open settings</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{config.title}</SheetTitle>
                  </SheetHeader>
                  <ConfigForm initialConfig={config} onSubmit={onChange} />
                </SheetContent>
              </Sheet>
            ) : (
              <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <SettingsIcon className="h-4 w-4" />
                    <span className="sr-only">Open settings</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="text-left">
                    <DrawerTitle>{config.title}</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-4 overflow-y-auto">
                    <ConfigForm initialConfig={config} onSubmit={onChange} />
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        </div>
        {error ? (
          <p className="text-destructive">Error loading data</p>
        ) : (
          <>
            <div className="space-y-1">
              {statType === 'min-max' ? (
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between items-baseline">
                    <ResponsiveTooltip content={
                      <TooltipContent label="Minimum Value" date={minDate} amount={currentValue.min} />
                    }>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-muted-foreground">Min</span>
                        <MoneyValue
                          className="text-lg font-bold"
                          useColors={false}
                          showSign={false}
                          amount={currentValue.min} />
                      </div>
                    </ResponsiveTooltip>

                    <ResponsiveTooltip content={
                      <TooltipContent label="Maximum Value" date={maxDate} amount={currentValue.max} />
                    }>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-muted-foreground">Max</span>
                        <MoneyValue
                          className="text-lg font-bold"
                          useColors={false}
                          showSign={false}
                          amount={currentValue.max} />
                      </div>
                    </ResponsiveTooltip>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <ResponsiveTooltip
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
                        </div>
                      }
                    >
                      <PercentageBadge percentage={percentageChange.min} reverted />
                    </ResponsiveTooltip>
                    <ResponsiveTooltip
                      content={
                        <div className="p-2">
                          <p className="font-semibold mb-1">Maximum Comparison</p>
                          <div className="flex justify-between items-center">
                            <span>Current:</span>
                            <MoneyValue amount={currentValue.max} className="font-medium" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Previous:</span>
                            <MoneyValue amount={comparisonValue.max} className="font-medium" />
                          </div>
                        </div>
                      }
                    >
                      <PercentageBadge percentage={percentageChange.max} reverted />
                    </ResponsiveTooltip>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-baseline">
                    <MoneyValue
                      className="text-2xl font-bold tracking-tight"
                      useColors={false}
                      showSign={false}
                      amount={currentValue} />
                    <PercentageBadge percentage={percentageChange} reverted={type === TransactionType.Expense} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      vs {comparison === 'previous' ? 'previous' : 'last year'}
                    </span>
                    <MoneyValue useColors={false} className="font-medium" amount={comparisonValue} />
                  </div>
                </>
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
};

StatisticsCard.displayName = 'StatisticsCard';

export default memo(StatisticsCard);
