import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategoryTreeStatistics } from '@/hooks/statistics/useCategoryTreeStatistics';
import { useTimeframeControl } from '@/hooks/useTimeframeControl';
import { Timeframe } from '@/types/global';
import { Type, Type as TransactionType } from '@/types/transaction';
import { formatShortDate } from '@/utils/formatShortDate';
import { ResponsivePie } from '@nivo/pie';
import sortBy from 'lodash/sortBy';
import { Calendar as CalendarIcon, CreditCard } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

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
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ProcessedCategory | null>(null);
  const [showMonthlyAverage, setShowMonthlyAverage] = useState<boolean>(false);

  const {
    timeframe,
    setTimeframe,
  } = useTimeframeControl({
    defaultTimeframe: {
      after: moment().startOf('month'),
      before: moment().endOf('month'),
    },
    enablePreviousTimeframe: false,
    enablePeriod: false,
  });

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: range.after ? moment(range.after).startOf('day') : timeframe.after,
        before: range.before ? moment(range.before).endOf('day') : timeframe.before,
      });
    },
    [timeframe.after, timeframe.before],
  );

  const { data: currentData, isLoading } = useCategoryTreeStatistics({
    type,
    after: timeframe.after,
    before: timeframe.before,
  });

  const processData = useCallback(
    (data: any[]): ProcessedCategory[] =>
      data?.map((category) => ({
        id: category.id,
        name: category.name,
        value: category.total,
        children: category.children ? processData(category.children) : undefined,
      })) || [],
    [],
  );

  const { rootCategories, totalCurrent } = useMemo(() => {
    const rootCategories = processData(currentData);
    const totalCurrent = rootCategories.reduce((sum, cat) => sum + cat.value, 0);
    return { rootCategories, totalCurrent };
  }, [currentData, processData]);

  const currentCategories = currentCategory ? currentCategory.children || [] : rootCategories;

  const calculateMonthlyAverage = useCallback(
    (value: number) => {
      const now = moment();
      const { before, after } = timeframe;

      let totalMonths: number;

      if (moment(before).isAfter(now)) {
        totalMonths = now.diff(moment(after), 'months');
      } else {
        totalMonths = moment(before).diff(moment(after), 'months');
      }
      return totalMonths > 0 ? value / totalMonths : value;
    },
    [timeframe],
  );

  const chartData = useMemo(() => {
    const data = currentCategory ? currentCategories : rootCategories;
    return sortBy(
      data.map((category) => ({
        ...category,
        value: showMonthlyAverage ? calculateMonthlyAverage(category.value) : category.value,
      })),
      'value',
    ).reverse();
  }, [currentCategory, currentCategories, rootCategories, showMonthlyAverage, calculateMonthlyAverage]);

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

  const breadcrumbs = [{ id: 0, name: 'All Categories' }, ...categoryStack.slice(1), currentCategory].filter(Boolean);

  const amountToDisplay = useMemo(() => {
    if (showMonthlyAverage) {
      const value = currentCategory ? currentCategory.value : totalCurrent;
      return calculateMonthlyAverage(value);
    }
    return currentCategory ? currentCategory.value : totalCurrent;
  }, [showMonthlyAverage, currentCategory, totalCurrent, calculateMonthlyAverage]);

  return (
    <>
      <Card
        className={`flex flex-col h-full w-full transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 ${className}`}
      >
        <CardHeader className="p-4 pb-0 space-y-0.2">
          <div className="flex justify-between items-start">
            <CardTitle className="tracking-tight text-lg font-bold mb-2">
              {type === TransactionType.Expense ? 'Expenses' : 'Income'}
            </CardTitle>
            <div className="flex items-center">
              <ConfigurationMenu
                timeframe={timeframe}
                type={type}
                setType={setType}
                showMonthlyAverage={showMonthlyAverage}
                setShowMonthlyAverage={setShowMonthlyAverage}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1">
          <DaterangePickerWithPresets
            after={timeframe.after}
            before={timeframe.before}
            onChange={handleTimeframeChange}
          >
            <span className="cursor-pointer hover:underline inline-flex flex-row mb-2">
              <span className="text-xs flex items-center">
                <CalendarIcon className="inline h-3 w-3 mr-1" />
                {formatShortDate(timeframe.after)} - {formatShortDate(timeframe.before)}
              </span>
            </span>
          </DaterangePickerWithPresets>

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
            <div className="flex flex-col">
              <div className="w-full h-64 md:h-96">
                <ResponsivePie
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  innerRadius={0.6}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  borderWidth={1}
                  colors={{ scheme: type === Type.Expense ? 'red_grey' : 'greens' }}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  enableArcLinkLabels={false}
                  enableArcLabels={false}
                  tooltip={({ datum: { data, value } }) => (
                    <div className="bg-popover text-popover-foreground p-2 rounded shadow-md">
                      <strong>{data.name}</strong>
                      <div>
                        <MoneyValue useColors={false} amount={value} />
                        <span className="ml-1 text-xs text-muted-foreground">
                          {((value / (currentCategory ? currentCategory.value : totalCurrent)) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                  onClick={(node) => handleCategoryStep(node.data as ProcessedCategory)}
                />
              </div>
              <div className="w-full mt-4">
                <ScrollArea className="h-64 md:h-96">
                  <div className="overflow-x-auto">
                    <div className="w-max min-w-full space-y-1">
                      {chartData.map((category) => (
                        <div
                          className="flex items-center justify-between text-sm p-1 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                          key={category.id}
                          onClick={() => handleCategoryStep(category)}
                        >
                          <ResponsiveTooltip
                            openDelay={1}
                            triggerClassName="truncate flex-1"
                            content={
                              <>
                                <code className="font-mono text-xs">#{category.id}</code>:{' '}
                                <span>{category.name}</span>
                              </>
                            }
                          >
                            <span className="truncate flex-1">
                              {category.name}
                              {category.value > 0 && (
                                <small className="ml-1 text-xs text-muted-foreground">
                                  (
                                  {(
                                    (category.value / (currentCategory ? currentCategory.value : totalCurrent)) *
                                    100
                                  ).toFixed()}
                                  %)
                                </small>
                              )}
                            </span>
                          </ResponsiveTooltip>
                          <div className="flex items-center space-x-2">
                            <MoneyValue useColors={false} amount={category.value} />
                            <div className="flex">
                              <ResponsiveTooltip
                                openDelay={1}
                                triggerClassName="m-0 p-0"
                                content="View transactions for this category within selected timeframe"
                              >
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
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t">
          <div className="w-full flex items-center justify-between min-h-[48px]">
            <span className="text-sm font-medium">Total</span>
            <MoneyValue className="text-lg font-semibold" useColors={false} amount={amountToDisplay} />
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
