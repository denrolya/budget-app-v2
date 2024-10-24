import isEqual from 'lodash/isEqual';
import { SettingsIcon } from 'lucide-react';
import { Moment } from 'moment';
import React, { memo, useMemo, useState } from 'react';

import { formatShortDate } from '@/utils/formatShortDate.ts';
import MoneyValue from '@/components/common/MoneyValue';
import ConfigForm from '@/components/features/statistics/StatisticsCard/ConfigForm';
import PercentageBadge from '@/components/features/statistics/StatisticsCard/PercentageBadge';
import PercentageIndicator from '@/components/features/statistics/StatisticsCard/PercentageIndicator';
import StatTypeBadge from '@/components/features/statistics/StatisticsCard/StatTypeBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from '@/components/ui/drawer';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { StatisticsConfig, Interval } from '@/types/statistics';
import { useValueByPeriod } from '@/hooks/statistics/useValueByPeriodStatistics';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Type as TransactionType } from '@/types/transaction';
import { generateSlug } from '@/utils/generateSlug';

interface Props {
  onChange: (index: number, newConfig: Partial<StatisticsConfig>) => void;
  config: StatisticsConfig;
}

const getPeriodText = (timeframe: Interval, period?: Interval): string => {
  if (period) {
    return `${timeframe.value} ${timeframe.unit}${timeframe.value > 1 ? 's' : ''} by ${period.value} ${period.unit}${period.value > 1 ? 's' : ''}`;
  }
  switch (timeframe.unit) {
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
  <Card className="w-[300px] h-[140px] overflow-hidden transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 relative flex-none snap-center">
    <CardContent className="p-4">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px] mt-2" />
    </CardContent>
  </Card>
);

const TooltipContent: React.FC<{
  label: string;
  amount: number;
  date?: Moment;
  selectedTimeframe: { after: Moment; before: Moment };
  comparisonTimeframe: { after: Moment; before: Moment };
  comparison: 'previous' | 'year';
}> = ({ label, amount, date, selectedTimeframe, comparisonTimeframe, comparison }) => (
  <div className="p-2">
    <p className="font-semibold mb-1">{label}</p>
    <MoneyValue className="text-lg font-bold mt-1" useColors={false} amount={amount} />
    {date && (
      <p className="text-xs mt-1">
        Date: {date.format('MMM D, YYYY')}
      </p>
    )}
    <p className="text-xs font-medium">
      Current period: {formatShortDate(selectedTimeframe.after)}
      {' - '}
      {formatShortDate(selectedTimeframe.before)}
    </p>
    <p className="text-xs font-medium">
      Comparison period: {formatShortDate(comparisonTimeframe.after)}
      {' - '}
      {formatShortDate(comparisonTimeframe.before)}
    </p>
    <p className="text-xs mt-1">
      Comparison: vs {comparison === 'previous' ? 'previous period' : 'same period last year'}
    </p>
  </div>
);

export const StatisticsCard: React.FC<Props> = ({ config, onChange }) => {
  const { title, type, categories, timeframe, period, comparison, statType } = config;
  const {
    currentValue,
    comparisonValue,
    percentageChange,
    isLoading,
    error,
    minDate,
    maxDate,
    selectedTimeframe,
    comparisonTimeframe,
  } = useValueByPeriod({ config }, [title, type, categories, timeframe, period, comparison, statType]);

  const id = useMemo(() => generateSlug([title, type, statType, comparison]), [title, type, statType, comparison]);

  const cardTitle = useMemo(() =>
      title || (categories?.length ? categories.join(', ') : (type === TransactionType.Income ? 'Income' : 'Expenses')),
    [title, categories, type]);

  const periodText = useMemo(() => getPeriodText(timeframe, period), [timeframe, period]);
  const [open, setOpen] = useState(false);
  const isDesktop = useScreenSize();

  if (isLoading) {
    return <StatisticsCardSkeleton />;
  }

  return (
    <Card
      className="w-[300px] h-[140px] overflow-hidden transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 relative flex-none snap-center"
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
            {isDesktop && (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
                    <SettingsIcon className="h-4 w-4" />
                    <span className="sr-only">Open settings</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{config.title}</SheetTitle>
                    <SheetDescription className="sr-only">Adjust card settings</SheetDescription>
                  </SheetHeader>
                  <ConfigForm initialConfig={config} onSubmit={onChange} />
                </SheetContent>
              </Sheet>
            )}
            {!isDesktop && (
              <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <SettingsIcon className="h-4 w-4" />
                    <span className="sr-only">Open settings</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[85vh] flex flex-col">
                  <DrawerHeader className="text-left">
                    <DrawerTitle>{config.title}</DrawerTitle>
                    <DrawerDescription className="sr-only">Adjust card settings</DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 overflow-y-auto">
                    <ConfigForm initialConfig={config} onSubmit={onChange} />
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        </div>
        {error && <p className="text-destructive">Error loading data</p>}
        {!error && (
          <>
            <div className="space-y-1">
              {(statType === 'min-max' && currentValue && typeof currentValue === 'object') && (
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between items-baseline">
                    <ResponsiveTooltip
                      openDelay={0}
                      desktopComponent="tooltip"
                      contentClassName="z-20"
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
                        <MoneyValue
                          className="text-lg font-bold"
                          useColors={false}
                          showSign={false}
                          amount={currentValue.min}
                        />
                      </div>
                    </ResponsiveTooltip>

                    <ResponsiveTooltip
                      openDelay={0}
                      desktopComponent="tooltip"
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
                        <MoneyValue
                          className="text-lg font-bold"
                          useColors={false}
                          showSign={false}
                          amount={currentValue.max}
                        />
                      </div>
                    </ResponsiveTooltip>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <ResponsiveTooltip
                      openDelay={0}
                      desktopComponent="tooltip"
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
                      <PercentageBadge percentage={percentageChange.min} reverted />
                    </ResponsiveTooltip>
                    <ResponsiveTooltip
                      openDelay={0}
                      desktopComponent="tooltip"
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
                      <PercentageBadge percentage={percentageChange.max} reverted />
                    </ResponsiveTooltip>
                  </div>
                </div>
              )}
              {statType !== 'min-max' && (
                <>
                  <div className="flex justify-between items-baseline">
                    <ResponsiveTooltip
                      openDelay={0}
                      desktopComponent="tooltip"
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
                      percentage={percentageChange as number}
                      reverted={type === TransactionType.Expense}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      vs {comparison === 'previous' ? 'previous' : 'last year'}
                    </span>
                    <ResponsiveTooltip
                      openDelay={0}
                      desktopComponent="tooltip"
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

export default memo(StatisticsCard, (prevProps, nextProps) => isEqual(prevProps.config, nextProps.config));
