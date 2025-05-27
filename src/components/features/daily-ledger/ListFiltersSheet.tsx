import { ArrowDownCircle, ArrowUpCircle, FilterIcon } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { useIsMobile } from '@/hooks/use-mobile';
import { TransactionFilters } from '@/models/TransactionFilters';
import { TransferFilters } from '@/models/TransferFilters';
import { Timeframe } from '@/types/global';
import { Type as TransactionType } from '@/types/transaction';

type CombinedFilters = TransactionFilters & TransferFilters;

interface ListFiltersContentProps {
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  setFilter: (type: keyof CombinedFilters, value: any) => void;
  showTransactions: boolean;
  setShowTransactions: (value: boolean) => void;
  showTransfers: boolean;
  setShowTransfers: (value: boolean) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe | null) => void;
}

interface ListFiltersProps extends ListFiltersContentProps {
  isOpen?: boolean;
  setIsOpen: (value: boolean) => void;
}

const ListFiltersContent: React.FC<ListFiltersContentProps> = ({
  transactionFilters,
  transferFilters,
  setFilter,
  showTransactions,
  setShowTransactions,
  showTransfers,
  setShowTransfers,
  timeframe,
  setTimeframe,
}) => {
  const [filtersActive, setFiltersActive] = useState<boolean>(false);

  useEffect(() => {
    const isActive =
      transactionFilters.categories.length > 0 ||
      transactionFilters.accounts.length > 0 ||
      transferFilters.accounts.length > 0 ||
      transactionFilters.isDraft !== null ||
      transactionFilters.type !== undefined ||
      transactionFilters.amountRange[0] !== undefined ||
      transactionFilters.amountRange[1] !== undefined ||
      timeframe.after.format(MOMENT_DATEPICKER_FORMAT) !== moment().startOf('week').format(MOMENT_DATEPICKER_FORMAT) ||
      timeframe.before.format(MOMENT_DATEPICKER_FORMAT) !== moment().endOf('week').format(MOMENT_DATEPICKER_FORMAT);
    setFiltersActive(isActive);
  }, [transactionFilters, transferFilters, timeframe]);

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: range.after ? moment(range.after).startOf('day') : timeframe.after,
        before: range.before ? moment(range.before).endOf('day') : timeframe.before,
      });
    },
    [setTimeframe],
  );

  const handleAmountRangeChange = useCallback(
    (value: [number | undefined, number | undefined]) => {
      setFilter('amountRange', value);
    },
    [setFilter],
  );

  const toggleDraftFilter = useCallback(() => {
    setFilter('isDraft', transactionFilters.isDraft === null ? true : transactionFilters.isDraft ? false : null);
    setShowTransactions(true);
    setShowTransfers(false);
  }, [setFilter, transactionFilters.isDraft, setShowTransactions, setShowTransfers]);

  const handleTransactionTypeChange = useCallback(
    (type: TransactionType | undefined) => {
      setFilter('type', transactionFilters.type === type ? undefined : type);
      setFilter('categories', []); // Reset categories when changing type
      setShowTransactions(true);
      setShowTransfers(false);
    },
    [setFilter, setShowTransactions, setShowTransfers],
  );

  const handleTransactionVisibilityToggle = useCallback(
    (visible: boolean) => {
      setShowTransactions(visible);
      if (!visible) {
        setFilter('categories', []);
        setFilter('type', undefined);
        setFilter('isDraft', null);
      }
    },
    [setShowTransactions, setFilter],
  );

  const handleCategoryChange = useCallback(
    (categories: any[]) => {
      setFilter('categories', categories);
      if (categories.length > 0) {
        setShowTransactions(true);
        setShowTransfers(false);
      }
    },
    [setFilter, setShowTransactions, setShowTransfers],
  );

  const handleResetFilters = useCallback(() => {
    setFilter('amountRange', [undefined, undefined]);
    setFilter('categories', []);
    setFilter('accounts', []);
    setFilter('isDraft', null);
    setFilter('type', undefined);
    setTimeframe(null);
    setShowTransactions(true);
    setShowTransfers(true);
  }, [setFilter, setTimeframe, setShowTransactions, setShowTransfers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={showTransactions ? 'default' : 'outline'}
          onClick={() => handleTransactionVisibilityToggle(!showTransactions)}
        >
          Transactions
        </Button>
        <Button variant={showTransfers ? 'default' : 'outline'} onClick={() => setShowTransfers(!showTransfers)}>
          Transfers
        </Button>
        <Button
          variant={
            transactionFilters.isDraft === true
              ? 'default'
              : transactionFilters.isDraft === false
                ? 'destructive'
                : 'outline'
          }
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
            onClick={() =>
              handleTransactionTypeChange(
                transactionFilters.type === TransactionType.Income ? undefined : TransactionType.Income,
              )
            }
          >
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Income
          </Button>
          <Button
            variant={transactionFilters.type === TransactionType.Expense ? 'destructive' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() =>
              handleTransactionTypeChange(
                transactionFilters.type === TransactionType.Expense ? undefined : TransactionType.Expense,
              )
            }
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Expense
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-range">Custom Date Range</Label>
        <DaterangePickerWithPresets
          id="date-range"
          className="w-full"
          after={timeframe.after}
          before={timeframe.before}
          onChange={handleTimeframeChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categories">Categories (Transactions)</Label>
        <CategoryTypeahead
          multiple
          id="categories"
          valueField="id"
          value={transactionFilters.categories}
          onChange={handleCategoryChange}
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
            onChange={(e) =>
              handleAmountRangeChange([
                e.target.value === '' ? undefined : Number(e.target.value),
                transactionFilters.amountRange[1],
              ])
            }
            className="w-full"
            placeholder="Min"
          />
          <span className="text-sm">to</span>
          <Input
            type="number"
            id="max-amount"
            value={transactionFilters.amountRange[1] === undefined ? '' : transactionFilters.amountRange[1]}
            onChange={(e) =>
              handleAmountRangeChange([
                transactionFilters.amountRange[0],
                e.target.value === '' ? undefined : Number(e.target.value),
              ])
            }
            className="w-full"
            placeholder="Max"
          />
        </div>
      </div>

      {filtersActive && (
        <Button onClick={handleResetFilters} variant="outline" className="w-full">
          Reset All Filters
        </Button>
      )}
    </div>
  );
};

export const ListFiltersSheet: React.FC<ListFiltersProps> = ({ isOpen = false, setIsOpen, ...props }) => {
  const isMobile = useIsMobile();

  const ContentWrapper = !isMobile ? Sheet : Drawer;
  const ContentHeader = !isMobile ? SheetHeader : DrawerHeader;
  const ContentTitle = !isMobile ? SheetTitle : DrawerTitle;
  const ContentDescription = !isMobile ? SheetDescription : DrawerDescription;
  const ContentContent = !isMobile ? SheetContent : DrawerContent;

  return (
    <ContentWrapper open={isOpen} onOpenChange={setIsOpen}>
      <ContentContent side={!isMobile ? 'right' : undefined} className={!isMobile ? 'sm:max-w-[425px]' : undefined}>
        <ContentHeader>
          <ContentTitle>Filters</ContentTitle>
          <ContentDescription className="sr-only">Adjust list filters</ContentDescription>
        </ContentHeader>
        <div className="mt-4 px-2">
          <ListFiltersContent {...props} />
        </div>
      </ContentContent>
    </ContentWrapper>
  );
};

export default ListFiltersSheet;
