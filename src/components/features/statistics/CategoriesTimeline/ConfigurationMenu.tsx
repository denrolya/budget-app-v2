import {
  BarChart,
  CalendarIcon,
  LineChart,
  Move3D,
  Percent,
  SettingsIcon,
  Tags,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useState } from 'react';

import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { useScreenSize } from '@/hooks/useScreenSize';
import { ISO8601Period } from '@/types/global';

const periodOptions: { value: ISO8601Period; label: string }[] = [
  { value: 'P1D', label: 'Daily' },
  { value: 'P1W', label: 'Weekly' },
  { value: 'P1M', label: 'Monthly' },
  { value: 'P3M', label: 'Quarterly' },
  { value: 'P1Y', label: 'Yearly' },
];

interface Timeframe {
  after: Moment;
  before: Moment;
}

interface UnifiedChartMenuProps {
  chartType: 'bar' | 'line';
  setChartType: (value: 'bar' | 'line') => void;
  selectedPeriod: ISO8601Period;
  setSelectedPeriod: (value: ISO8601Period) => void;
  selectedCategories: number[];
  setSelectedCategories: (categories: number[]) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  showExpenseReference: boolean,
  setShowExpenseReference: (value: boolean) => void,
  showIncomeReference: boolean,
  setShowIncomeReference: (value: boolean) => void,
  showComparisonInTooltip: boolean;
  setShowComparisonInTooltip: (value: boolean) => void;
  fetchTransactionsFromSubcategories: boolean;
  setFetchTransactionsFromSubcategories: (value: boolean) => void;
  useSeparateAxisForTotals: boolean;
  setUseSeparateAxisForTotals: (value: boolean) => void;
}

const TIMEFRAME_PRESETS = [
  {
    label: 'Prev Month',
    range: { from: moment().subtract(1, 'month').startOf('month'), to: moment().subtract(1, 'month').endOf('month') },
  },
  { label: 'This Month', range: { from: moment().startOf('month'), to: moment().endOf('month') } },
  {
    label: 'Summer',
    range: { from: moment().month(5).startOf('month'), to: moment().month(8).endOf('month') },
  },
  {
    label: 'Winter',
    range: { from: moment().month(11).startOf('month'), to: moment().month(2).endOf('month') },
  },
  {
    label: 'Spring',
    range: { from: moment().month(2).startOf('month'), to: moment().month(5).endOf('month') },
  },
  {
    label: 'Autumn',
    range: { from: moment().month(8).startOf('month'), to: moment().month(11).endOf('month') },
  },
  { label: 'This Year', range: { from: moment().startOf('year'), to: moment().endOf('year') } },
  {
    label: 'Last Year',
    range: { from: moment().subtract(1, 'year').startOf('year'), to: moment().subtract(1, 'year').endOf('year') },
  },
  {
    label: 'Last 2 Years',
    range: { from: moment().subtract(2, 'year').startOf('year'), to: moment() },
  },
  {
    label: 'Last 3 Years',
    range: { from: moment().subtract(3, 'year').startOf('year'), to: moment() },
  },
  {
    label: 'Last 5 Years',
    range: { from: moment().subtract(5, 'year').startOf('year'), to: moment() },
  },
  {
    label: 'Last 10 Years',
    range: { from: moment().subtract(10, 'year').startOf('year'), to: moment() },
  },
];

export const UnifiedChartMenu: React.FC<UnifiedChartMenuProps> = ({
                                                                    chartType,
                                                                    setChartType,
                                                                    selectedPeriod,
                                                                    setSelectedPeriod,
                                                                    selectedCategories,
                                                                    setSelectedCategories,
                                                                    timeframe,
                                                                    setTimeframe,
                                                                    showExpenseReference,
                                                                    setShowExpenseReference,
                                                                    showIncomeReference,
                                                                    setShowIncomeReference,
                                                                    showComparisonInTooltip,
                                                                    setShowComparisonInTooltip,
                                                                    fetchTransactionsFromSubcategories,
                                                                    setFetchTransactionsFromSubcategories,
                                                                    useSeparateAxisForTotals,
                                                                    setUseSeparateAxisForTotals,
                                                                  }) => {
  const isDesktop = useScreenSize();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState<boolean>(false);

  const handleDateRangeChange = useCallback((range: { from: Date | undefined; to: Date | undefined }) => {
    setTimeframe({
      after: range.from ? moment(range.from).startOf('day') : timeframe.after,
      before: range.to ? moment(range.to).endOf('day') : timeframe.before,
    });
  }, [setTimeframe]);


  const MenuContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Period</Label>
        <div className="flex flex-wrap gap-2">
          {periodOptions.map(option => (
            <Button
              key={option.value}
              variant={selectedPeriod === option.value ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod(option.value)}
            >
              {option.label[0]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-range">Timeframe</Label>
        <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button id="date-range" variant="outline" size="sm" className="h-9 text-sm w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
                {timeframe.after && timeframe.before && `${timeframe.after.format(MOMENT_DATEPICKER_FORMAT)} - ${timeframe.before.format(MOMENT_DATEPICKER_FORMAT)}`}
                {!timeframe.after && timeframe.before && `Before ${timeframe.before.format(MOMENT_DATEPICKER_FORMAT)}`}
                {timeframe.after && !timeframe.before && `After ${timeframe.after.format(MOMENT_DATEPICKER_FORMAT)}`}
                {!timeframe.after && !timeframe.before && 'Select date range'}
              </span>
            </Button>
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
              onSelect={handleDateRangeChange}
              numberOfMonths={isDesktop ? 2 : 1}
              className="border-b"
            />
            <div className="p-3 space-y-3">
              <h4 className="font-medium text-sm text-primary">Presets</h4>
              <div className="grid grid-cols-2 gap-2">
                {TIMEFRAME_PRESETS.map((preset) => (
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="categories">Categories</Label>
        </div>

        <CategoryTypeahead
          multiple
          id="categories"
          valueField="id"
          value={selectedCategories}
          onChange={categories => setSelectedCategories(categories)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Chart Type</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            className="flex items-center px-2 py-1 space-x-1"
            variant={chartType === 'line' ? 'default' : 'outline'}
            onClick={() => setChartType('line')}>
            <LineChart className="h-4 w-4" />
            Line
          </Button>
          <Button
            className="flex items-center px-2 py-1 space-x-1"
            variant={chartType === 'bar' ? 'default' : 'outline'}
            onClick={() => setChartType('bar')}>
            <BarChart className="h-4 w-4" />
            Bar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Display Options</Label>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-total-expense" className="flex items-center space-x-2 text-xs cursor-pointer">
            <TrendingDown className="h-3 w-3" />
            <span>Show Total Expense</span>
          </Label>
          <Switch
            id="show-total-expense"
            className="scale-75"
            checked={showExpenseReference}
            onCheckedChange={() => setShowExpenseReference(!showExpenseReference)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-total-income" className="flex items-center space-x-2 text-xs cursor-pointer">
            <TrendingUp className="h-3 w-3" />
            <span>Show Income Reference</span>
          </Label>
          <Switch
            id="show-total-income"
            className="scale-75"
            checked={showIncomeReference}
            onCheckedChange={() => setShowIncomeReference(!showIncomeReference)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-comparison-in-tooltip" className="flex items-center space-x-2 text-xs cursor-pointer">
            <Percent className="h-3 w-3" />
            <span>Show Comparison In Tooltip</span>
          </Label>
          <Switch
            id="show-comparison-in-tooltip"
            className="scale-75"
            checked={showComparisonInTooltip}
            onCheckedChange={() => setShowComparisonInTooltip(!showComparisonInTooltip)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor="fetch-transactions-from-subcategories"
            className="flex items-center space-x-2 text-xs cursor-pointer">
            <Tags className="h-3 w-3" />
            <span>Fetch Transactions From Subcategories</span>
          </Label>
          <Switch
            id="fetch-transactions-from-subcategories"
            className="scale-75"
            checked={fetchTransactionsFromSubcategories}
            onCheckedChange={() => setFetchTransactionsFromSubcategories(!fetchTransactionsFromSubcategories)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor="use-separate-axis-for-totals"
            className="flex items-center space-x-2 text-xs cursor-pointer">
            <Move3D className="h-3 w-3" />
            <span>Use separate Y Axis for Totals</span>
          </Label>
          <Switch
            id="use-separate-axis-for-totals"
            className="scale-75"
            checked={useSeparateAxisForTotals}
            onCheckedChange={() => setUseSeparateAxisForTotals(!useSeparateAxisForTotals)}
          />
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
            <SettingsIcon className="h-4 w-4" />
            <span className="sr-only">Open settings</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-3 w-100">
          <MenuContent />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-6">
        <DrawerHeader>
          <DrawerTitle>Chart Options</DrawerTitle>
          <DrawerDescription className="sr-only">Categories Timeline configuration</DrawerDescription>
        </DrawerHeader>
        <MenuContent />
      </DrawerContent>
    </Drawer>
  );
};

export default UnifiedChartMenu;

