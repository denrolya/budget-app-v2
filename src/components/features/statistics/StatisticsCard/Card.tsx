import isEqual from 'lodash/isEqual';
import { SettingsIcon } from 'lucide-react';
import { Moment } from 'moment';
import React, { memo, useMemo, useState } from 'react';

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
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useValueByPeriod } from '@/hooks/statistics/useValueByPeriodStatistics';
import { useScreenSize } from '@/hooks/useScreenSize';
import { ComparisonType, Interval, StatisticsConfig, StatisticsType } from '@/types/statistics';
import { Type as TransactionType } from '@/types/transaction';
import { MinMaxStatistics, PercentageChange, StatisticsData } from '@/types/valueByPeriodStatistics';
import { formatShortDate } from '@/utils/formatShortDate.ts';
import { generateSlug } from '@/utils/generateSlug';

const isMinMaxStatistics = (value: any): value is MinMaxStatistics => value && typeof value.min === 'number' && typeof value.max === 'number';

interface Props {
  onChange: (newConfig: Partial<StatisticsConfig>) => void;
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
  comparison: ComparisonType;
}> = ({
        label,
        amount,
        date,
        selectedTimeframe,
        comparisonTimeframe,
        comparison,
      }) => (
  <>
    <div className="flex justify-between items-center">
      <p className="text-xs font-medium">{formatShortDate(selectedTimeframe.after)} - {formatShortDate(selectedTimeframe.before)}</p>
      <p className="text-xs text-muted-foreground">{formatShortDate(comparisonTimeframe.after)} - {formatShortDate(comparisonTimeframe.before)}</p>
    </div>
    <Separator className="my-2" />
    <h3 className="font-semibold text-sm">{label}</h3>
    <p className="text-base font-bold">
      <MoneyValue className="font-medium font-mono" useColors={false} amount={amount} />
    </p>
    {date && <p className="text-muted-foreground">Date: {date.format('MMM D, YYYY')}</p>}
    <Separator className="my-2" />
    <p className="pt-1">
      vs {comparison === 'previous' ? 'previous period' : 'same period last year'}
    </p>
  </>
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

  const renderMinMaxSection = (
    currentValue: StatisticsData<StatisticsType>,
    comparisonValue: StatisticsData<StatisticsType>,
    percentageChange: PercentageChange<StatisticsType>,
    selectedTimeframe: { after: Moment; before: Moment },
    comparisonTimeframe: { after: Moment; before: Moment },
    minDate: Moment | undefined,
    maxDate: Moment | undefined,
  ) => {
    if (
      statType === StatisticsType.MinMax &&
      isMinMaxStatistics(currentValue) &&
      isMinMaxStatistics(comparisonValue) &&
      typeof percentageChange === 'object' &&
      'min' in percentageChange &&
      'max' in percentageChange
    ) {
      return (
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
              <PercentageBadge percentage={percentageChange.min} reverted />
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
              <PercentageBadge percentage={percentageChange.max} reverted />
            </ResponsiveTooltip>
          </div>
        </div>
      );
    }
    return null;
  };

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
              {renderMinMaxSection(currentValue, comparisonValue, percentageChange, selectedTimeframe, comparisonTimeframe, minDate, maxDate)}
              {statType !== StatisticsType.MinMax && (
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
