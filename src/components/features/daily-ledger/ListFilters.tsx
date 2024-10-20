import { CalendarIcon, FileText, FilterIcon, Layers, X } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Badge } from '@/components/ui/badge';
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
import { TransferFilters } from '@/models/TransferFilters';

type CombinedFilters = TransactionFilters & TransferFilters

interface CombinedFiltersProps {
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  setFilter: (type: keyof CombinedFilters, value: any) => void;
  showTransactions: boolean;
  setShowTransactions: (value: boolean) => void;
  showTransfers: boolean;
  setShowTransfers: (value: boolean) => void;
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

const CombinedFiltersContent: React.FC<CombinedFiltersProps> = ({
                                                                  transactionFilters,
                                                                  transferFilters,
                                                                  setFilter,
                                                                  showTransactions,
                                                                  setShowTransactions,
                                                                  showTransfers,
                                                                  setShowTransfers,
                                                                }) => {
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState<boolean>(false);
  const isDesktop = useScreenSize();

  const handleDateRangeChange = useCallback((range: {
    from: Date | Moment | undefined;
    to: Date | Moment | undefined
  }) => {
    const fromMoment = range.from ? moment(range.from) : undefined;
    const toMoment = range.to ? moment(range.to) : undefined;
    setFilter('after', fromMoment);
    setFilter('before', toMoment);
  }, [setFilter]);

  const handleAmountRangeChange = useCallback((value: [number | undefined, number | undefined]) => {
    setFilter('amountRange', value);
  }, [setFilter]);

  const toggleDraftFilter = useCallback(() => {
    setFilter('isDraft', transactionFilters.isDraft === null ? true : transactionFilters.isDraft ? false : null);
  }, [setFilter, transactionFilters.isDraft]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={showTransactions ? 'default' : 'outline'}
          onClick={() => setShowTransactions(!showTransactions)}
        >
          Transactions
        </Button>
        <Button
          variant={showTransfers ? 'default' : 'outline'}
          onClick={() => setShowTransfers(!showTransfers)}
        >
          Transfers
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={transactionFilters.isDraft === true ? 'default' : transactionFilters.isDraft === false ? 'destructive' : 'outline'}
              onClick={toggleDraftFilter}
            >
              <FileText className="h-4 w-4 mr-2" />
              {transactionFilters.isDraft === true ? 'Drafts' : transactionFilters.isDraft === false ? 'No Drafts' : 'All'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle draft transactions filter</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-range">Date Range</Label>
        <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button id="date-range" variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
                {transactionFilters.after && transactionFilters.before
                  ? `${transactionFilters.after.format(MOMENT_DATEPICKER_FORMAT)} - ${transactionFilters.before.format(MOMENT_DATEPICKER_FORMAT)}`
                  : transactionFilters.after
                    ? `After ${transactionFilters.after.format(MOMENT_DATEPICKER_FORMAT)}`
                    : transactionFilters.before
                      ? `Before ${transactionFilters.before.format(MOMENT_DATEPICKER_FORMAT)}`
                      : 'Select date range'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={transactionFilters.after?.toDate() || moment().toDate()}
              selected={{
                from: transactionFilters.after?.toDate(),
                to: transactionFilters.before?.toDate(),
              }}
              onSelect={handleDateRangeChange}
              numberOfMonths={isDesktop ? 2 : 1}
              className="border-b"
            />
            <div className="p-3 space-y-3">
              <h4 className="font-medium text-sm">Presets</h4>
              <div className="grid grid-cols-2 gap-2">
                {datePresets.map((preset) => (
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
          <Label htmlFor="categories">Categories (Transactions)</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={transactionFilters.withNestedCategories ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setFilter('withNestedCategories', !transactionFilters.withNestedCategories)}
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
          value={transactionFilters.categories}
          onChange={(categories) => setFilter('categories', categories)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accounts">Accounts</Label>
        <AccountTypeahead
          id="accounts"
          multiple
          value={[...new Set([...transactionFilters.accounts, ...transferFilters.accounts])]}
          onChange={(accounts) => {
            setFilter('accounts', accounts);
          }}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount-range" className="flex items-center">
          <FilterIcon className="mr-2 h-4 w-4" />
          Amount Range
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            id="min-amount"
            value={transactionFilters.amountRange[0] === undefined ? '' : transactionFilters.amountRange[0]}
            onChange={(e) => handleAmountRangeChange([e.target.value === '' ? undefined : Number(e.target.value), transactionFilters.amountRange[1]])}
            className="w-full"
            placeholder="Min"
          />
          <span className="text-sm">to</span>
          <Input
            type="number"
            id="max-amount"
            value={transactionFilters.amountRange[1] === undefined ? '' : transactionFilters.amountRange[1]}
            onChange={(e) => handleAmountRangeChange([transactionFilters.amountRange[0], e.target.value === '' ? undefined : Number(e.target.value)])}
            className="w-full"
            placeholder="Max"
          />
        </div>
      </div>

      <Button onClick={() => {
        setFilter('amountRange', [undefined, undefined]);
        setFilter('after', undefined);
        setFilter('before', undefined);
        setFilter('categories', []);
        setFilter('accounts', []);
        setFilter('isDraft', null);
        setFilter('withNestedCategories', false);
      }} variant="outline" className="w-full">
        Reset All Filters
      </Button>
    </div>
  );
};

export default function CombinedFilters(props: CombinedFiltersProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isDesktop = useScreenSize();

  const FilterWrapper = isDesktop ? Sheet : Drawer;
  const FilterHeader = isDesktop ? SheetHeader : DrawerHeader;
  const FilterTitle = isDesktop ? SheetTitle : DrawerTitle;
  const FilterTrigger = isDesktop ? SheetTrigger : DrawerTrigger;
  const FilterContent = isDesktop ? SheetContent : DrawerContent;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    const { transactionFilters, transferFilters } = props;

    if (transactionFilters.after || transactionFilters.before) count++;
    if (transactionFilters.categories.length > 0) count++;
    if (transactionFilters.accounts.length > 0 || transferFilters.accounts.length > 0) count++;
    if (transactionFilters.amountRange[0] !== undefined || transactionFilters.amountRange[1] !== undefined) count++;
    if (transactionFilters.withNestedCategories) count++;
    if (transactionFilters.isDraft !== null) count++;

    return count;
  }, [props.transactionFilters, props.transferFilters]);

  return (
    <FilterWrapper open={isOpen} onOpenChange={setIsOpen}>
      <FilterTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg fixed bottom-20 right-4 z-50"
        >
          <FilterIcon className="h-6 w-6" />
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 px-2 py-1 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </FilterTrigger>
      <FilterContent side={isDesktop ? 'right' : undefined} className={isDesktop ? 'sm:max-w-[425px]' : undefined}>
        <FilterHeader>
          <FilterTitle>Filters</FilterTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </Button>
        </FilterHeader>
        <div className="mt-4 px-4">
          <CombinedFiltersContent {...props} />
        </div>
      </FilterContent>
    </FilterWrapper>
  );
}
