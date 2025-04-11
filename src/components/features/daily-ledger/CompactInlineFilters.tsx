import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useEffect, useState } from 'react';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { TransactionFilters } from '@/models/TransactionFilters';
import { TransferFilters } from '@/models/TransferFilters';
import { Timeframe } from '@/types/global';
import { Type as TransactionType } from '@/types/transaction';

type CombinedFilters = TransactionFilters & TransferFilters;

interface CompactInlineFiltersProps {
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  setFilter: (type: keyof CombinedFilters, value: any) => void;
  showTransactions: boolean;
  setShowTransactions: (value: boolean) => void;
  showTransfers: boolean;
  setShowTransfers: (value: boolean) => void;
  timeframe: { after: Moment; before: Moment };
  setCustomTimeframe: (range: { after: Moment; before: Moment } | null) => void;
}

export const CompactInlineFilters: React.FC<CompactInlineFiltersProps> = ({
  transactionFilters,
  transferFilters,
  setFilter,
  showTransactions,
  setShowTransactions,
  showTransfers,
  setShowTransfers,
  timeframe,
  setCustomTimeframe,
}) => {
  const [, setFiltersActive] = useState<boolean>(false);

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
      setCustomTimeframe({
        after: range.after ? range.after.startOf('day') : timeframe.after,
        before: range.before ? range.before.endOf('day') : timeframe.before,
      });
    },
    [setCustomTimeframe],
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

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 relative">
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              className="text-xs"
              variant={showTransactions ? 'default' : 'outline'}
              onClick={() => handleTransactionVisibilityToggle(!showTransactions)}
            >
              <ROUTES.TRANSACTION_LIST.icon className="mr-2 h-4 w-4" />
              Transactions
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle transaction visibility</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              className="text-xs"
              variant={showTransfers ? 'default' : 'outline'}
              onClick={() => setShowTransfers(!showTransfers)}
            >
              <ROUTES.TRANSFER_LIST.icon className="mr-2 h-4 w-4" />
              Transfers
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle transfer visibility</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-8" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            className="text-xs"
            variant={
              transactionFilters.isDraft === true
                ? 'default'
                : transactionFilters.isDraft === false
                  ? 'destructive'
                  : 'outline'
            }
            onClick={toggleDraftFilter}
          >
            {transactionFilters.isDraft === true
              ? 'Drafts'
              : transactionFilters.isDraft === false
                ? 'No Drafts'
                : 'All'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Filter by draft status (Transactions only)</p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              className="text-xs"
              variant={transactionFilters.type === TransactionType.Income ? 'success' : 'outline'}
              onClick={() =>
                handleTransactionTypeChange(
                  transactionFilters.type === TransactionType.Income ? undefined : TransactionType.Income,
                )
              }
            >
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Income
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Filter income transactions</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              className="text-xs"
              variant={transactionFilters.type === TransactionType.Expense ? 'destructive' : 'outline'}
              onClick={() =>
                handleTransactionTypeChange(
                  transactionFilters.type === TransactionType.Expense ? undefined : TransactionType.Expense,
                )
              }
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Expense
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Filter expense transactions</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-8" />

      <DaterangePickerWithPresets after={timeframe.after} before={timeframe.before} onChange={handleTimeframeChange} />

      <Separator orientation="vertical" className="h-8" />

      <div className="flex-grow min-w-[12rem] max-w-xs">
        <AccountTypeahead
          id="accounts"
          multiple
          value={[...new Set([...transactionFilters.accounts, ...transferFilters.accounts])]}
          onChange={(accounts) => {
            setFilter('accounts', accounts);
          }}
          placeholder="Accounts"
          className="w-full"
        />
      </div>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex-grow min-w-[12rem] max-w-xs">
        <CategoryTypeahead
          multiple
          id="categories"
          valueField="id"
          value={transactionFilters.categories}
          onChange={handleCategoryChange}
          placeholder="Categories"
          className="w-full"
        />
      </div>

      <Separator orientation="vertical" className="h-8" />

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
          className="w-24"
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
          className="w-24"
          placeholder="Max"
        />
      </div>
    </div>
  );
};

export default CompactInlineFilters;
