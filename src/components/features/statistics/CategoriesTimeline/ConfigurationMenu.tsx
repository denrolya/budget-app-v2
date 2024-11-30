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

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { useScreenSize } from '@/hooks/useScreenSize';
import { ISO8601Period } from '@/types/global';
import { Type as TransactionType } from '@/types/transaction';
import { BarChart, CalendarIcon, LineChart, SettingsIcon } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useState } from 'react';

const periodOptions: { value: ISO8601Period; label: string }[] = [
  { value: 'P1D', label: 'Daily' },
  { value: 'P1W', label: 'Weekly' },
  { value: 'P1M', label: 'Monthly' },
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
        <RadioGroup
          value={chartType}
          onValueChange={(value) => setChartType(value as 'bar' | 'line')}
          className="flex space-x-2"
        >
          {[
            { value: 'bar', label: 'Bar', icon: BarChart },
            { value: 'line', label: 'Line', icon: LineChart },
          ].map(({ value, label, icon: Icon }) => (
            <div key={value} className="flex items-center">
              <RadioGroupItem value={value} id={value} className="sr-only peer" />
              <Label
                htmlFor={value}
                className="flex items-center space-x-1 rounded-md px-2 py-1 text-xs cursor-pointer peer-checked:bg-primary peer-checked:text-primary-foreground hover:bg-muted"
              >
                <Icon className="h-3 w-3" />
                <span>{label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
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
  } else {
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
  }
};

export default UnifiedChartMenu;

