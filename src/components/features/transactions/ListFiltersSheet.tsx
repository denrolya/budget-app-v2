import debounce from 'lodash/debounce';
import { ArrowDownCircle, ArrowUpCircle, CalendarIcon, FileText, FilterIcon, Layers } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useIsMobile } from '@/hooks/useMobile';
import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FILTER_PRESETS, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { TransactionFilters } from '@/models/TransactionFilters';
import { Timeframe } from '@/types/global';
import { Type as TransactionType } from '@/types/transaction';

interface ListFiltersProps {
  isOpen?: boolean;
  setIsOpen: (open: boolean) => void;
  data: TransactionFilters;
  onChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => void;
  onReset: () => void;
}

const Content: React.FC<ListFiltersProps> = ({ data, onChange, onReset }) => {
  const [localAmountRange, setLocalAmountRange] = useState(data.amountRange);

  const debouncedOnChange = useRef(
    debounce(<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => {
      onChange(key, value);
    }, 300),
  ).current;

  useEffect(
    () => () => {
      debouncedOnChange.cancel();
    },
    [debouncedOnChange],
  );

  useEffect(() => {
    setLocalAmountRange(data.amountRange);
  }, [data.amountRange]);

  const handleMinAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = e.target.value === '' ? undefined : parseInt(e.target.value);
      setLocalAmountRange((prev) => [newMin, prev[1]]);
      debouncedOnChange('amountRange', [newMin, localAmountRange[1]]);
    },
    [localAmountRange, debouncedOnChange],
  );

  const handleMaxAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = e.target.value === '' ? undefined : parseInt(e.target.value);
      setLocalAmountRange((prev) => [prev[0], newMax]);
      debouncedOnChange('amountRange', [localAmountRange[0], newMax]);
    },
    [localAmountRange, debouncedOnChange],
  );

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      onChange('after', range.after ? range.after : undefined);
      onChange('before', range.before ? range.before : undefined);
    },
    [onChange],
  );

  const handleTransactionTypeChange = useCallback(
    (type: TransactionType | undefined) => {
      onChange('type', data.type === type ? undefined : type);
    },
    [onChange, data.type],
  );

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
              <span className="sr-only">Only Drafts</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Show only draft transactions</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-type">Transaction Type</Label>
        <div className="flex space-x-2">
          <Button
            variant={data.type === TransactionType.Income ? 'success' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => handleTransactionTypeChange(TransactionType.Income)}
          >
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Income
          </Button>
          <Button
            variant={data.type === TransactionType.Expense ? 'destructive' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => handleTransactionTypeChange(TransactionType.Expense)}
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Expense
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-range">Date Range</Label>
        <DaterangePickerWithPresets
          after={data.after}
          before={data.before}
          onChange={handleTimeframeChange}
          presets={FILTER_PRESETS}
        >
          <Button id="date-range" variant="outline" size="sm" className="h-9 text-sm w-full justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>
              {data.after &&
                data.before &&
                `${data.after.format(MOMENT_DATEPICKER_FORMAT)} - ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`}
              {!data.after && data.before && `Before ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`}
              {data.after && !data.before && `After ${data.after.format(MOMENT_DATEPICKER_FORMAT)}`}
              {!data.after && !data.before && 'Select date range'}
            </span>
          </Button>
        </DaterangePickerWithPresets>
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

export const ListFiltersSheet: React.FC<ListFiltersProps> = ({
  isOpen = false,
  setIsOpen,
  data,
  onChange,
  onReset,
}) => {
  const isMobile = useIsMobile();

  const handleChange = useCallback(
    <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => {
      onChange(key, value);
    },
    [onChange],
  );

  const FilterWrapper = !isMobile ? Sheet : Drawer;
  const FilterHeader = !isMobile ? SheetHeader : DrawerHeader;
  const FilterTitle = !isMobile ? SheetTitle : DrawerTitle;
  const FilterDescription = !isMobile ? SheetDescription : DrawerDescription;
  const FilterContent = !isMobile ? SheetContent : DrawerContent;

  return (
    <FilterWrapper open={isOpen} onOpenChange={setIsOpen}>
      <FilterContent
        side={!isMobile ? 'right' : undefined}
        className={!isMobile ? 'w-[400px] sm:w-[540px]' : undefined}
      >
        <FilterHeader>
          <FilterTitle>Transaction Filters</FilterTitle>
          <FilterDescription className="sr-only">
            Filter transactions by dates, accounts, categories etc.
          </FilterDescription>
        </FilterHeader>
        <div className={!isMobile ? 'mt-4' : 'px-4 pb-4'}>
          <Content data={data} onChange={handleChange} onReset={onReset} />
        </div>
      </FilterContent>
    </FilterWrapper>
  );
};

export default ListFiltersSheet;
