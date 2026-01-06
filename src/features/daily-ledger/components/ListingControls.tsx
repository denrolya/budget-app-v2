import { CalendarArrowDown, CalendarArrowUp, CalendarIcon, FileText, Layers, RotateCcw } from 'lucide-react';
import { Moment } from 'moment';
import React, { useCallback, useMemo } from 'react';

import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import CategoryTypeahead from '@/features/categories/components/CategoryTypeahead';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TransactionFilters } from '@/models/TransactionFilters';
import { TransferFilters } from '@/models/TransferFilters';
import { Timeframe } from '@/types/global';
import { Type as TransactionType } from '@/types/transaction';

type CombinedFilters = TransactionFilters & TransferFilters;

interface ListingControlsProps {
  isLoading?: boolean;
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  setFilter: (type: keyof CombinedFilters, value: any) => void;
  setShowTransactions: (value: boolean) => void;
  setShowTransfers: (value: boolean) => void;
  timeframe: { after: Moment; before: Moment };
  setTimeframe: (range: { after: Moment; before: Moment } | null) => void;
  activeView: 'table' | 'list';
  isReversedOrder: boolean;
  setIsReversedOrder: (value: boolean) => void;
  handleResetFilters: () => void;
  onFiltersDialogToggle: () => void;
}

const H = 'h-9';
const ICON_BTN = cn(H, 'w-9');
const TYPEAHEAD_W = 'w-[18rem]';
const AMOUNT_W = 'w-24';
const DATE_TEXT = 'max-w-44 truncate';

const Divider: React.FC = () => (
  <span aria-hidden="true" className="hidden md:block h-6 w-px bg-border mx-1.5" />
);

export const ListingControls: React.FC<ListingControlsProps> = ({
                                                                  isLoading,
                                                                  transactionFilters,
                                                                  transferFilters,
                                                                  setFilter,
                                                                  setShowTransactions,
                                                                  setShowTransfers,
                                                                  timeframe,
                                                                  setTimeframe,
                                                                  activeView,
                                                                  isReversedOrder,
                                                                  setIsReversedOrder,
                                                                  handleResetFilters,
                                                                  onFiltersDialogToggle,
                                                                }) => {
  const accountsValue = useMemo(() => {
    const t = Array.isArray(transactionFilters.accounts) ? transactionFilters.accounts : [];
    const tr = Array.isArray(transferFilters.accounts) ? transferFilters.accounts : [];
    return [...new Set([...t, ...tr])];
  }, [transactionFilters.accounts, transferFilters.accounts]);

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: range.after ? range.after.startOf('day') : timeframe.after,
        before: range.before ? range.before.endOf('day') : timeframe.before,
      });
    },
    [setTimeframe, timeframe.after, timeframe.before],
  );

  const dateLabel = useMemo(
    () => `${timeframe.after.format('DD MMM')} - ${timeframe.before.format('DD MMM')}`,
    [timeframe.after, timeframe.before],
  );

  const showOrderToggle = activeView === 'table';
  const OrderIcon = isReversedOrder ? CalendarArrowUp : CalendarArrowDown;

  const isIncome = transactionFilters.type === TransactionType.Income;
  const isExpense = transactionFilters.type === TransactionType.Expense;

  const setType = useCallback(
    (type: TransactionType) => {
      setFilter('type', transactionFilters.type === type ? undefined : type);
    },
    [setFilter, transactionFilters.type],
  );

  const toggleDraft = useCallback(() => {
    setFilter('isDraft', !transactionFilters.isDraft);
  }, [setFilter, transactionFilters.isDraft]);

  const toggleNestedCategories = useCallback(() => {
    setFilter('withNestedCategories', !transactionFilters.withNestedCategories);
  }, [setFilter, transactionFilters.withNestedCategories]);

  const canReset = Boolean(transactionFilters.activeCount) && !isLoading;

  return (
    <div className="border-b bg-muted/30 supports-[backdrop-filter]:bg-muted/30">
      <div
        role="toolbar"
        aria-label="Ledger filters"
        className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2"
      >
        {/* DATE + ORDER */}
        <div className="flex items-center gap-1.5">
          <div role="group" aria-label="Date range" className="flex items-center">
            <DaterangePickerWithPresets
              after={timeframe.after}
              before={timeframe.before}
              onChange={handleTimeframeChange}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(H, 'bg-background px-2')}
                aria-label="Select date range"
              >
                <CalendarIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                <span className={DATE_TEXT}>{dateLabel}</span>
              </Button>
            </DaterangePickerWithPresets>
          </div>

          {showOrderToggle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={ICON_BTN}
                  onClick={() => setIsReversedOrder(!isReversedOrder)}
                  aria-label="Toggle ordering"
                  aria-pressed={isReversedOrder}
                >
                  <OrderIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle ordering</TooltipContent>
            </Tooltip>
          )}
        </div>

        <Divider />

        {/* MAIN SELECTORS */}
        <div className="flex items-center gap-1.5">
          <div className={cn('flex items-center', TYPEAHEAD_W)} role="group" aria-label="Accounts filter">
            <AccountTypeahead
              multiple
              value={accountsValue}
              onChange={(accounts) => setFilter('accounts', accounts)}
              placeholder="Accounts"
              className="w-full"
              aria-label="Filter by accounts"
            />
          </div>

          <Divider />

          <div className={cn('flex items-center', TYPEAHEAD_W)} role="group" aria-label="Categories filter">
            <CategoryTypeahead
              multiple
              value={transactionFilters.categories}
              onChange={(categories) => {
                setFilter('categories', categories);
                if (categories?.length) {
                  setShowTransactions(true);
                  setShowTransfers(false);
                }
              }}
              placeholder="Categories"
              className="w-full"
              aria-label="Filter by categories"
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={transactionFilters.withNestedCategories ? 'secondary' : 'outline'}
                size="icon"
                className={ICON_BTN}
                onClick={toggleNestedCategories}
                aria-label="Nested categories"
                aria-pressed={transactionFilters.withNestedCategories}
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Nested categories</TooltipContent>
          </Tooltip>
        </div>

        <Divider />

        {/* AMOUNT + TYPE + DRAFT */}
        <div className="flex items-center gap-1.5">
          <div role="group" aria-label="Amount range" className="flex items-center gap-1.5">
            <Input
              type="number"
              value={transactionFilters.amountRange[0] ?? ''}
              onChange={(e) =>
                setFilter('amountRange', [
                  e.target.value === '' ? undefined : Number(e.target.value),
                  transactionFilters.amountRange[1],
                ])
              }
              className={cn(H, AMOUNT_W, 'bg-background')}
              placeholder="Min"
              aria-label="Minimum amount"
            />
            <Input
              type="number"
              value={transactionFilters.amountRange[1] ?? ''}
              onChange={(e) =>
                setFilter('amountRange', [
                  transactionFilters.amountRange[0],
                  e.target.value === '' ? undefined : Number(e.target.value),
                ])
              }
              className={cn(H, AMOUNT_W, 'bg-background')}
              placeholder="Max"
              aria-label="Maximum amount"
            />
          </div>

          <Divider />

          <div role="group" aria-label="Transaction type" className={cn('flex items-center', H)}>
            <div className={cn('flex items-stretch overflow-hidden rounded-md border bg-background', H)}>
              <Button
                type="button"
                variant={isIncome ? 'success' : 'ghost'}
                size="sm"
                className="h-full rounded-none px-2"
                onClick={() => setType(TransactionType.Income)}
                aria-pressed={isIncome}
              >
                Income
              </Button>

              <div className="self-center h-5 w-px bg-border" aria-hidden="true" />

              <Button
                type="button"
                variant={isExpense ? 'destructive' : 'ghost'}
                size="sm"
                className="h-full rounded-none px-2"
                onClick={() => setType(TransactionType.Expense)}
                aria-pressed={isExpense}
              >
                Expense
              </Button>
            </div>
          </div>

          <Divider />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={transactionFilters.isDraft ? 'secondary' : 'outline'}
                size="icon"
                className={ICON_BTN}
                onClick={toggleDraft}
                aria-label="Only drafts"
                aria-pressed={transactionFilters.isDraft}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Only drafts</TooltipContent>
          </Tooltip>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="ml-0 md:ml-auto flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={ICON_BTN}
                disabled={!canReset}
                onClick={handleResetFilters}
                aria-label="Reset filters"
              >
                <RotateCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset filters</TooltipContent>
          </Tooltip>

          <FiltersToggleButton activeCount={transactionFilters.activeCount} onClick={onFiltersDialogToggle} />
        </div>
      </div>
    </div>
  );
};

export default ListingControls;
