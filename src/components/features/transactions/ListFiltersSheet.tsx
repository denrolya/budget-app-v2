import debounce from 'lodash/debounce';
import { CalendarIcon, FileText, FilterIcon, Layers } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { useScreenSize } from '@/hooks/useScreenSize';
import { TransactionFilters } from '@/models/TransactionFilters';

interface ListFiltersProps extends React.PropsWithChildren {
  data: TransactionFilters;
  onChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => void;
  onReset: () => void;
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

const Content: React.FC<ListFiltersProps> = ({ data, onChange, onReset }) => {
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState<boolean>(false);
  const [localAmountRange, setLocalAmountRange] = useState(data.amountRange);
  const isDesktop = useScreenSize();

  const debouncedOnChange = useRef(
    debounce(<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => {
      onChange(key, value);
    }, 300),
  ).current;

  useEffect(() => () => {
    debouncedOnChange.cancel();
  }, [debouncedOnChange]);

  useEffect(() => {
    setLocalAmountRange(data.amountRange);
  }, [data.amountRange]);

  const handleMinAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = e.target.value === '' ? undefined : parseInt(e.target.value);
    setLocalAmountRange(prev => [newMin, prev[1]]);
    debouncedOnChange('amountRange', [newMin, localAmountRange[1]]);
  }, [localAmountRange, debouncedOnChange]);

  const handleMaxAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = e.target.value === '' ? undefined : parseInt(e.target.value);
    setLocalAmountRange(prev => [prev[0], newMax]);
    debouncedOnChange('amountRange', [localAmountRange[0], newMax]);
  }, [localAmountRange, debouncedOnChange]);

  const handleDateRangeChange = useCallback((range: { from: Date | undefined; to: Date | undefined }) => {
    onChange('after', range.from ? moment(range.from) : undefined);
    onChange('before', range.to ? moment(range.to) : undefined);
  }, [onChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={data.isDraft ? 'secondary' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => debouncedOnChange('isDraft', !data.isDraft)}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Show draft transactions</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-range">Date Range</Label>
        <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button id="date-range" variant="outline" size="sm" className="h-9 text-sm w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
                {data.after && data.before
                  ? `${data.after.format(MOMENT_DATEPICKER_FORMAT)} - ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`
                  : data.after
                    ? `After ${data.after.format(MOMENT_DATEPICKER_FORMAT)}`
                    : data.before
                      ? `Before ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`
                      : 'Select date range'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[100]" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={data.after?.toDate() || moment().toDate()}
              selected={{
                from: data.after?.toDate(),
                to: data.before?.toDate(),
              }}
              onSelect={handleDateRangeChange}
              numberOfMonths={isDesktop ? 2 : 1}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={data.withNestedCategories ? 'secondary' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => debouncedOnChange('withNestedCategories', !data.withNestedCategories)}
              >
                <Layers className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle nested categories view</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CategoryTypeahead
          id="categories"
          multiple
          value={data.categories}
          onChange={(categories) => onChange('categories', categories)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accounts">Accounts</Label>
        <AccountTypeahead
          id="accounts"
          multiple
          value={data.accounts}
          onChange={(accounts) => onChange('accounts', accounts)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount-range" className="flex items-center text-sm font-medium">
          <FilterIcon className="mr-2 h-4 w-4" />
          Amount Range
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            id="min-amount"
            value={localAmountRange[0] === undefined ? '' : localAmountRange[0]}
            onChange={handleMinAmountChange}
            className="w-full"
            placeholder="Min"
          />
          <span className="text-sm">to</span>
          <Input
            type="number"
            id="max-amount"
            value={localAmountRange[1] === undefined ? '' : localAmountRange[1]}
            onChange={handleMaxAmountChange}
            className="w-full"
            placeholder="Max"
          />
        </div>
      </div>

      <Button onClick={onReset} variant="outline" className="w-full">
        Reset Filters
      </Button>
    </div>
  );
};

export const ListFiltersSheet: React.FC<ListFiltersProps> = ({ data, onChange, onReset, children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isDesktop = useScreenSize();

  const handleChange = useCallback(<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => {
    onChange(key, value);
  }, [onChange]);

  const FilterWrapper = isDesktop ? Sheet : Drawer;
  const FilterHeader = isDesktop ? SheetHeader : DrawerHeader;
  const FilterTitle = isDesktop ? SheetTitle : DrawerTitle;
  const FilterTrigger = isDesktop ? SheetTrigger : DrawerTrigger;
  const FilterContent = isDesktop ? SheetContent : DrawerContent;


  return (
    <FilterWrapper open={isOpen} onOpenChange={setIsOpen}>
      <FilterTrigger asChild>
        {children}
      </FilterTrigger>
      <FilterContent
        side={isDesktop ? 'right' : undefined}
        className={isDesktop ? 'w-[400px] sm:w-[540px]' : undefined}>
        <FilterHeader>
          <FilterTitle>Transaction Filters</FilterTitle>
        </FilterHeader>
        <div className={isDesktop ? 'mt-4' : 'px-4 pb-4'}>
          <Content data={data} onChange={handleChange} onReset={onReset} />
        </div>
      </FilterContent>
    </FilterWrapper>
  );
};

export default ListFiltersSheet;
