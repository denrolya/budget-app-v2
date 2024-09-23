'use client';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { TransactionFilters } from '@/models/TransactionFilters';
import cn from 'classnames';
import { CalendarIcon, FilterIcon } from 'lucide-react';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

interface ListFiltersProps {
  data: TransactionFilters;
  className?: string;
  onChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => void;
}

const datePresets = [
  { label: 'This Month', range: { from: moment().startOf('month'), to: moment().endOf('month') } },
  { label: 'Last 30 Days', range: { from: moment().subtract(30, 'days'), to: moment() } },
  { label: 'This Year', range: { from: moment().startOf('year'), to: moment().endOf('year') } },
  {
    label: 'Last Year',
    range: { from: moment().subtract(1, 'year').startOf('year'), to: moment().subtract(1, 'year').endOf('year') },
  },
];

const FilterContent: React.FC<ListFiltersProps & { isMobile?: boolean }> = ({ data, onChange, isMobile = false }) => {
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState<boolean>(false);
  const [isAmountPopoverOpen, setIsAmountPopoverOpen] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    onChange('after', range.from ? moment(range.from) : undefined);
    onChange('before', range.to ? moment(range.to) : undefined);
  };

  const handleAmountChange = (value: number[]) => {
    onChange('amountRange', value);
  };

  const commonClasses = isMobile ? 'w-full' : 'w-auto';

  return (
    <div className={isMobile ? 'space-y-4' : 'flex items-center gap-2'}>
      <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn('h-9 text-sm', commonClasses)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">
              {data.after && data.before
                ? `${data.after.format(MOMENT_DATEPICKER_FORMAT)} - ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`
                : data.after
                  ? `After ${data.after.format(MOMENT_DATEPICKER_FORMAT)}`
                  : data.before
                    ? `Before ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`
                    : 'Date'}
            </span>
            <span className="sm:hidden">Date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={data.after?.toDate() || moment().toDate()}
              selected={{
                from: data.after?.toDate(),
                to: data.before?.toDate(),
              }}
              onSelect={handleDateRangeChange}
              numberOfMonths={isMobileView ? 1 : 2}
              className="border-b"
            />
            <div className="p-3 space-y-3">
              <h4 className="font-medium text-sm text-primary">Presets</h4>
              <div className="grid grid-cols-2 gap-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant="secondary"
                    className="w-full justify-start text-left text-xs"
                    onClick={() => {
                      handleDateRangeChange(preset.range);
                      setIsDatePopoverOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <CategoryTypeahead
        multiple
        value={data.categories}
        onChange={(categories) => onChange('categories', categories)}
        className={cn('h-9 text-sm', commonClasses)}
      />

      <AccountTypeahead
        multiple
        value={data.accounts}
        onChange={(accounts) => onChange('accounts', accounts)}
        className={cn('h-9 text-sm', commonClasses)}
      />

      <Popover open={isAmountPopoverOpen} onOpenChange={setIsAmountPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn('h-9 text-sm', commonClasses)}>
            <FilterIcon className="mr-2 h-4 w-4" />
            ${data.amountRange[0]} - ${data.amountRange[1]}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium leading-none mb-2 text-primary">Amount Range</h4>
            <Slider
              min={0}
              max={10000}
              step={100}
              value={data.amountRange}
              onValueChange={handleAmountChange}
            />
            <div className="flex justify-between mt-2">
              <Input
                type="number"
                value={data.amountRange[0]}
                onChange={(e) => onChange('amountRange', [parseInt(e.target.value), data.amountRange[1]])}
                className="w-20 text-sm"
              />
              <Input
                type="number"
                value={data.amountRange[1]}
                onChange={(e) => onChange('amountRange', [data.amountRange[0], parseInt(e.target.value)])}
                className="w-20 text-sm"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant={data.withNestedCategories ? 'secondary' : 'outline'}
        size="sm"
        className={cn('h-9 text-sm', commonClasses)}
        onClick={() => onChange('withNestedCategories', !data.withNestedCategories)}
      >
        <span className="hidden sm:inline">Nested Categories</span>
        <span className="sm:hidden">Nested</span>
      </Button>

      <Button
        variant={data.isDraft ? 'secondary' : 'outline'}
        size="sm"
        className={cn('h-9 text-sm', commonClasses)}
        onClick={() => onChange('isDraft', !data.isDraft)}
      >
        Drafts
      </Button>
    </div>
  );
};

export const ListFilters: React.FC<ListFiltersProps> = ({ data, className, onChange }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className={cn('bg-background rounded-lg shadow-md', className)}>
      <div className="hidden md:flex items-center gap-2 p-4">
        <FilterContent data={data} onChange={onChange} />
      </div>

      <div className="md:hidden">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Open filters">
              <FilterIcon className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <FilterContent data={data} onChange={onChange} isMobile={true} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default ListFilters;
