import { ArrowDownCircle, ArrowUpCircle, CalendarIcon, FilterIcon, X } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useState } from 'react';

import { Type as TransactionType } from '@/types/transaction';
import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useScreenSize } from '@/hooks/useScreenSize';
import { TransactionFilters } from '@/models/TransactionFilters';
import { TransferFilters } from '@/models/TransferFilters';


type CombinedFilters = TransactionFilters & TransferFilters

interface ListFiltersProps extends React.PropsWithChildren {
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  setFilter: (type: keyof CombinedFilters, value: any) => void;
  showTransactions: boolean;
  setShowTransactions: (value: boolean) => void;
  showTransfers: boolean;
  setShowTransfers: (value: boolean) => void;
  dateRange: { startDate: moment.Moment; endDate: moment.Moment };
  setCustomDateRange: (range: { startDate: moment.Moment; endDate: moment.Moment } | null) => void;
}

const ListFiltersContent: React.FC<ListFiltersProps> = ({
                                                          transactionFilters,
                                                          transferFilters,
                                                          setFilter,
                                                          showTransactions,
                                                          setShowTransactions,
                                                          showTransfers,
                                                          setShowTransfers,
                                                          dateRange,
                                                          setCustomDateRange,
                                                        }) => {
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState<boolean>(false);
  const isDesktop = useScreenSize();

  const handleDateRangeChange = useCallback((range: { from: Date | undefined; to: Date | undefined }) => {
    if (range.from && range.to) {
      setCustomDateRange({
        startDate: moment(range.from),
        endDate: moment(range.to),
      });
    }
  }, [setCustomDateRange]);

  const handleAmountRangeChange = useCallback((value: [number | undefined, number | undefined]) => {
    setFilter('amountRange', value);
  }, [setFilter]);

  const toggleDraftFilter = useCallback(() => {
    setFilter('isDraft', transactionFilters.isDraft === null ? true : transactionFilters.isDraft ? false : null);
  }, [setFilter, transactionFilters.isDraft]);

  const handleTransactionTypeChange = useCallback((type: TransactionType | undefined) => {
    setFilter('type', transactionFilters.type === type ? undefined : type);
    if (transactionFilters.type) {
      setShowTransfers(false);
    }
  }, [setFilter, setShowTransfers, transactionFilters.type]);

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
        <Button
          variant={transactionFilters.isDraft === true ? 'default' : transactionFilters.isDraft === false ? 'destructive' : 'outline'}
          onClick={toggleDraftFilter}
        >
          {transactionFilters.isDraft === true ? 'Drafts' : transactionFilters.isDraft === false ? 'No Drafts' : 'All'}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-type">Transaction Type</Label>
        <div className="flex space-x-2">
          <Button
            variant={transactionFilters.type === TransactionType.Income ? 'success' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => handleTransactionTypeChange(TransactionType.Income)}
          >
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Income
          </Button>
          <Button
            variant={transactionFilters.type === TransactionType.Expense ? 'destructive' : 'outline'}
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
        <Label htmlFor="date-range">Custom Date Range</Label>
        <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button id="date-range" variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
                {dateRange.startDate.format('MMM D, YYYY')} - {dateRange.endDate.format('MMM D, YYYY')}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.startDate.toDate()}
              selected={{
                from: dateRange.startDate.toDate(),
                to: dateRange.endDate.toDate(),
              }}
              onSelect={handleDateRangeChange}
              numberOfMonths={isDesktop ? 2 : 1}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categories">Categories (Transactions)</Label>
        <CategoryTypeahead
          multiple
          id="categories"
          valueField="id"
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

      <Button
        onClick={() => {
          setFilter('amountRange', [undefined, undefined]);
          setFilter('categories', []);
          setFilter('accounts', []);
          setFilter('isDraft', null);
          setCustomDateRange(null);
        }} variant="outline" className="w-full">
        Reset All Filters
      </Button>
    </div>
  );
};

export const ListFiltersSheet: React.FC<ListFiltersProps> = ({ children, ...props }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isDesktop = useScreenSize();

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
      <FilterContent side={isDesktop ? 'right' : undefined} className={isDesktop ? 'sm:max-w-[425px]' : undefined}>
        <FilterHeader>
          <FilterTitle>Filters</FilterTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </Button>
        </FilterHeader>
        <div className="mt-4 px-4">
          <ListFiltersContent {...props} />
        </div>
      </FilterContent>
    </FilterWrapper>
  );
};

export default ListFiltersSheet;
