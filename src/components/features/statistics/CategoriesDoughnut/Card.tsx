import { ResponsivePie } from '@nivo/pie';
import sortBy from 'lodash/sortBy';
import { Calendar as CalendarIcon, CreditCard } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import ConfigurationMenu from '@/components/features/statistics/CategoriesDoughnut/ConfigurationMenu';
import Skeleton from '@/components/features/statistics/CategoriesDoughnut/Skeleton';
import TransactionsDrawer from '@/components/features/statistics/CategoriesDoughnut/TransactionsDrawer';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DASHBOARD_TIMEFRAME_OPTIONS } from '@/constants/datetime';
import { useCategoryTreeStatistics } from '@/hooks/statistics/useCategoryTreeStatistics';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Timeframe } from '@/types/global';
import { Type as TransactionType } from '@/types/transaction';
import { formatShortDate } from '@/utils/formatShortDate';

interface ProcessedCategory {
  id: number;
  name: string;
  value: number;
  children?: ProcessedCategory[];
}

export const CategoriesDoughnutCard: React.FC<React.ComponentPropsWithoutRef<'div'>> = ({ className }) => {
  const [currentCategory, setCurrentCategory] = useState<ProcessedCategory | null>(null);
  const [categoryStack, setCategoryStack] = useState<ProcessedCategory[]>([]);
  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [timeframe, setTimeframe] = useState<Timeframe>({
    after: moment().startOf('month'),
    before: moment().endOf('month'),
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ProcessedCategory | null>(null);
  const [showMonthlyAverage, setShowMonthlyAverage] = useState<boolean>(false); // Toggle state
  const isDesktop = useScreenSize();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState<boolean>(false);

  const handleTimeframeChange = useCallback((range: Timeframe) => {
    setTimeframe({
      after: range.after ? moment(range.after).startOf('day') : timeframe.after,
      before: range.before ? moment(range.before).endOf('day') : timeframe.before,
    });
  }, [setTimeframe]);

  const { data: currentData, isLoading } = useCategoryTreeStatistics({
    type,
    after: timeframe.after,
    before: timeframe.before,
  });

  const processData = (data: any[]): ProcessedCategory[] =>
    data?.map((category) => ({
      id: category.id,
      name: category.name,
      value: category.total,
      children: category.children ? processData(category.children) : undefined,
    })) || [];

  const { rootCategories, totalCurrent } = useMemo(() => {
    const rootCategories = processData(currentData);
    const totalCurrent = rootCategories.reduce((sum, cat) => sum + cat.value, 0);
    return { rootCategories, totalCurrent };
  }, [currentData]);

  const currentCategories = currentCategory ? currentCategory.children || [] : rootCategories;

  const calculateMonthlyAverage = (value: number) => {
    const totalMonths = moment(timeframe.before).diff(moment(timeframe.after), 'months', true);
    return totalMonths > 0 ? value / totalMonths : value;
  };

  const chartData = useMemo(() => {
    const data = currentCategory ? currentCategories : rootCategories;
    return sortBy(
      data.map((category) => ({
        ...category,
        value: showMonthlyAverage ? calculateMonthlyAverage(category.value) : category.value,
      })),
      'value',
    ).reverse();
  }, [currentCategories, rootCategories, showMonthlyAverage, calculateMonthlyAverage]);

  const handleCategoryStep = (category: ProcessedCategory) => {
    if (category.children && category.children.length > 0) {
      setCategoryStack((prevStack) => [
        ...prevStack,
        currentCategory || {
          id: 0,
          name: 'Root',
          value: totalCurrent,
          children: rootCategories,
        },
      ]);
      setCurrentCategory(category);
    }
  };

  const handleCategoryClick = (category: ProcessedCategory) => {
    setSelectedCategory(category);
    setIsDrawerOpen(true);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setCurrentCategory(null);
      setCategoryStack([]);
    } else {
      const newStack = categoryStack.slice(0, index);
      setCurrentCategory(newStack[newStack.length - 1]);
      setCategoryStack(newStack.slice(0, -1));
    }
  };

  const breadcrumbs = [
    { id: 0, name: 'All Categories' },
    ...categoryStack.slice(1),
    currentCategory,
  ].filter(Boolean);

  const amountToDisplay = useMemo(() => {
    if (showMonthlyAverage) {
      const value = currentCategory ? currentCategory.value : totalCurrent;
      return calculateMonthlyAverage(value);
    }
    return currentCategory ? currentCategory.value : totalCurrent;
  }, [showMonthlyAverage, currentCategory, totalCurrent, calculateMonthlyAverage]);

  return (
    <>
      <Card className={`w-full transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 ${className}`}>
        <CardHeader className="p-4 pb-0 space-y-0.2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-medium">
              {type === TransactionType.Expense ? 'Expenses' : 'Income'}
            </CardTitle>
            <div className="flex items-center">
              <ConfigurationMenu
                type={type}
                setType={setType}
                showMonthlyAverage={showMonthlyAverage}
                setShowMonthlyAverage={setShowMonthlyAverage}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <span className="cursor-pointer inline-flex flex-row mb-2">
                <span className="text-xs flex items-center">
                  <CalendarIcon className="inline h-3 w-3 mr-1" />
                  {formatShortDate(timeframe.after)} - {formatShortDate(timeframe.before)}
                </span>
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100]" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={timeframe.after?.toDate() || moment().toDate()}
                selected={{
                  from: timeframe.after?.toDate(),
                  to: timeframe.before?.toDate(),
                }}
                onSelect={({ from, to }) => handleTimeframeChange({ after: from, before: to })}
                numberOfMonths={isDesktop ? 2 : 1}
                className="border-b"
              />
              <div className="p-3 space-y-3">
                <h4 className="font-medium text-sm text-primary">Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  {DASHBOARD_TIMEFRAME_OPTIONS.map(({ label, range }) => (
                    <Button
                      key={label}
                      size="sm"
                      variant="outline"
                      className="w-full justify-start text-left text-xs"
                      onClick={() => handleTimeframeChange(range)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Breadcrumb>
            <BreadcrumbList className="flex-wrap">
              {breadcrumbs.map(({ id, name }, index) => (
                <React.Fragment key={id}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbLink className="cursor-pointer" onClick={() => handleBreadcrumbClick(index)}>
                        {name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {isLoading && <Skeleton />}
          {!isLoading && currentCategories.length > 0 && (
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 h-64 md:h-96">
                <ResponsivePie
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  innerRadius={0.6}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  enableArcLinkLabels={false}
                  enableArcLabels={false}
                  tooltip={({ datum: { data, value } }) => (
                    <div className="bg-popover text-popover-foreground p-2 rounded shadow-md">
                      <strong>{data.name}</strong>
                      <div>
                        <MoneyValue className="font-mono" useColors={false} amount={value} />
                        <span className="ml-1 text-xs text-muted-foreground">
                          {((value / (currentCategory ? currentCategory.value : totalCurrent)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  onClick={(node) => handleCategoryStep(node.data as ProcessedCategory)}
                />
              </div>
              <div className="w-full md:w-1/2 mt-4 md:mt-0 md:ml-4">
                <ScrollArea className="h-64 md:h-96">
                  <div className="space-y-1">
                    {chartData.map((category) => (
                      <div
                        className="flex items-center justify-between text-sm p-1 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                        key={category.id}
                        onClick={() => handleCategoryStep(category)}
                      >
                        <ResponsiveTooltip
                          openDelay={1}
                          triggerClassName="truncate flex-1"
                          content={<>
                            <code className="font-mono text-xs">#{category.id}</code>: <span className="font-medium">{category.name}</span>
                          </>}>
                          <span className="truncate flex-1">{category.name}</span>
                        </ResponsiveTooltip>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm whitespace-nowrap">
                            <MoneyValue className="font-medium" useColors={false} amount={category.value} />
                            <span className="ml-1 text-xs text-muted-foreground">{((category.value / (currentCategory ? currentCategory.value : totalCurrent)) * 100).toFixed(1)}%</span>
                          </span>
                          <div className="flex">
                            <ResponsiveTooltip
                              openDelay={1}
                              triggerClassName="m-0 p-0"
                              content="View transactions for this category within selected timeframe">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                aria-label="View transactions"
                                onClick={() => handleCategoryClick(category)}
                              >
                                <CreditCard className="h-4 w-4" />
                                <span className="sr-only">View transactions</span>
                              </Button>
                            </ResponsiveTooltip>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t">
          <div className="w-full flex items-center justify-between min-h-[48px]">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold">
              <MoneyValue className="font-mono" useColors={false} amount={amountToDisplay} />
            </span>
          </div>
        </CardFooter>
      </Card>

      {selectedCategory && (
        <TransactionsDrawer
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          selectedCategory={selectedCategory}
          timeframe={timeframe}
        />
      )}
    </>
  );
};

export default CategoriesDoughnutCard;
