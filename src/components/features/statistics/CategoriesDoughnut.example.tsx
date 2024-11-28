import { ResponsivePie } from '@nivo/pie';
import { CalendarIcon, InfoIcon } from 'lucide-react';
import moment from 'moment';
import { useTheme } from 'next-themes';
import React, { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';

import { MoneyValue } from '@/components/common/MoneyValue';
import Pagination from '@/components/common/Pagination';
import FormattedListing from '@/components/features/transactions/FormattedListing';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FILTER_PRESETS, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useCategoryTreeStatistics } from '@/hooks/statistics/useCategoryTreeStatistics';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useTransactions } from '@/hooks/useTransactions';
import TransactionFilters from '@/models/TransactionFilters';
import { Type as TransactionType } from '@/types/transaction';

interface TransactionsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategory: ProcessedCategory | null;
  timeframe: {
    after: moment.Moment;
    before: moment.Moment;
  };
}

export const TransactionsDrawer: React.FC<TransactionsDrawerProps> = ({
                                                                        isOpen,
                                                                        onOpenChange,
                                                                        selectedCategory,
                                                                        timeframe,
                                                                      }) => {
  const { openForm } = useFormContext();
  const {
    groupedItems: groupedTransactions,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    error: transactionsError,
    refetch: refetchTransactions,
    pagination: { currentPage, perPage, totalPages, totalItems, setCurrentPage, setPerPage },
    setFilter,
  } = useTransactions({
    updateUrl: false,
    initialFilters: new TransactionFilters({
      withNestedCategories: true,
    }),
  });

  useEffect(() => {
    if (isOpen && selectedCategory?.id) {
      setFilter('categories', [selectedCategory?.id]);
      setFilter('after', timeframe.after);
      setFilter('before', timeframe.before);
    }
  }, [isOpen, selectedCategory, timeframe, setFilter, refetchTransactions]);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Transactions for {selectedCategory?.name}</DrawerTitle>
          <DrawerDescription>
            {timeframe.after.format(MOMENT_DATEPICKER_FORMAT)} - {timeframe.before.format(MOMENT_DATEPICKER_FORMAT)}
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="h-[60vh] px-4">
          <FormattedListing
            error={transactionsError}
            isError={isTransactionsError}
            isLoading={isTransactionsLoading}
            groupedItems={groupedTransactions}
            refetch={refetchTransactions}
            onAdd={() => openForm(FormType.Transaction)}
          />
        </ScrollArea>
        <DrawerFooter>
          <Pagination
            isLoading={isTransactionsLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
            perPage={perPage}
            totalItems={totalItems}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};


interface CategoryNode {
  id: number;
  name: string;
  children?: CategoryNode[];
  total: number;
}

interface ProcessedCategory {
  id: number;
  name: string;
  value: number;
  children?: ProcessedCategory[];
}

interface Props {
  type: TransactionType;
}

const ExpensesChart: React.FC<Props> = ({ type }) => {
  const { theme } = useTheme();
  const [currentCategory, setCurrentCategory] = useState<ProcessedCategory | null>(null);
  const [categoryStack, setCategoryStack] = useState<ProcessedCategory[]>([]);
  const [timeframe, setTimeframe] = useState({
    after: moment().startOf('month'),
    before: moment().endOf('month'),
  });
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const isDesktop = useScreenSize();

  const { data: currentData } = useCategoryTreeStatistics({
    type,
    after: timeframe.after,
    before: timeframe.before,
  });

  const processData = (data: CategoryNode[]): ProcessedCategory[] => data?.map((category) => ({
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

  const chartData = useMemo(() => {
    if (currentCategory) {
      const directSpending = currentCategory.value - (currentCategory.children?.reduce((sum, child) => sum + child.value, 0) || 0);
      const directSpendingCategory = directSpending > 0 ? [{
        id: currentCategory.id,
        name: `${currentCategory.name} (Direct)`,
        value: directSpending,
      }] : [];
      return [...directSpendingCategory, ...currentCategories];
    }
    return currentCategories;
  }, [currentCategory, currentCategories]);

  const handleCategoryDoubleClick = (category: ProcessedCategory) => {
    if (category.children && category.children.length > 0) {
      setCategoryStack((prevStack) => [...prevStack, currentCategory || {
        id: 0,
        name: 'Root',
        value: totalCurrent,
        children: rootCategories,
      }]);
      setCurrentCategory(category);
    }
  };

  const handleCategoryClick = (category: ProcessedCategory) => {
    setSelectedCategory(category);
    setIsDrawerOpen(true);
  };

  const breadcrumbs = [
    { id: 0, name: 'All Categories' },
    ...categoryStack.slice(1),
    currentCategory,
  ].filter(Boolean);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setTimeframe({
        after: moment(range.from),
        before: moment(range.to),
      });
    }
    setIsDatePopoverOpen(false);
  };

  return (
    <>
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              {type === TransactionType.Expense ? 'Expenses' : 'Income'} Overview
            </CardTitle>
            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button id="date-range" variant="outline" className="w-[260px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>
                    {timeframe.after.format(MOMENT_DATEPICKER_FORMAT)} - {timeframe.before.format(MOMENT_DATEPICKER_FORMAT)}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={timeframe.after.toDate()}
                  selected={{
                    from: timeframe.after.toDate(),
                    to: timeframe.before.toDate(),
                  }}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={isDesktop ? 2 : 1}
                />
                <div className="p-3 space-y-3">
                  <h4 className="font-medium text-sm">Presets</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {FILTER_PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        size="sm"
                        variant="outline"
                        className="w-full justify-start text-left text-xs"
                        onClick={() => handleDateRangeChange(preset.range)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{item.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        onClick={() => {
                          setCurrentCategory(item === breadcrumbs[0] ? null : item as ProcessedCategory);
                          setCategoryStack(breadcrumbs.slice(1, index + 1) as ProcessedCategory[]);
                        }}>
                        {item.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-stretch">
            <div className="w-full md:w-1/2 h-[300px] md:h-[400px]">
              <ResponsivePie
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{
                  from: 'color',
                  modifiers: [['darker', 0.2]],
                }}
                enableArcLinkLabels={false}
                enableArcLabels={false}
                valueFormat={value => <MoneyValue className="font-mono font-medium" useColors={false} amount={value} />}
                theme={{
                  background: 'transparent',
                  textColor: theme === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
                  fontSize: 11,
                  tooltip: {
                    container: {
                      background: theme === 'dark' ? '#333' : '#fff',
                      color: theme === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
                    },
                  },
                }}
                tooltip={({ datum: { data, value } }) => (
                    <div className="bg-card text-card-foreground p-2 rounded shadow-md">
                      <strong>{data.name}</strong>
                      <div>Total: <MoneyValue className="font-mono font-medium" useColors={false} amount={value} /></div>
                    </div>
                  )}
                onClick={(node, event) => {
                  if (event.detail === 2 && !node.data.name.endsWith('(Direct)')) {
                    handleCategoryDoubleClick(node.data as ProcessedCategory);
                  } else if (event.detail === 1) {
                    handleCategoryClick(node.data as ProcessedCategory);
                  }
                }}
              />
            </div>
            <div className="w-full md:w-1/2 mt-4 md:mt-0 md:ml-4 space-y-2">
              <div className="font-semibold text-lg mb-2">Category Breakdown</div>
              {chartData.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50 transition-colors">
                  <span className="truncate flex-1">{category.name}</span>
                  <span className="font-medium ml-2">
                    <MoneyValue className="font-mono font-medium" useColors={false} amount={category.value} />
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {((category.value / (currentCategory ? currentCategory.value : totalCurrent)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t mt-4">
                <div className="flex items-center justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>
                    <MoneyValue className="font-mono font-medium" useColors={false} amount={currentCategory ? currentCategory.value : totalCurrent} />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>Click to view transactions, double-click to drill down</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <InfoIcon className="h-4 w-4" />
                    <span className="sr-only">Chart information</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This chart shows your {type === TransactionType.Expense ? 'expenses' : 'income'} by category.</p>
                  <p>Click on a category to view transactions or double-click to see subcategories.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <TransactionsDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        selectedCategory={selectedCategory}
        timeframe={timeframe}
      />
    </>
  );
};

export default ExpensesChart;
