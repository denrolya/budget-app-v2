import {
  ArrowDownLeft,
  ArrowDownRight,
  CalendarArrowDown,
  CalendarArrowUp,
  CalendarIcon,
  Layers,
  Search,
} from 'lucide-react';
import { type Moment } from 'moment';
import React, { useMemo } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCY_OPTIONS } from '@/constants/currency';
import { type TransactionFilters } from '@/features/transactions';
import { type TransferFilters } from '@/features/transfers';
import { cn } from '@/lib/utils';

import { useFilterInputs } from '../hooks/useFilterInputs';

interface Props {
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  showTransactions: boolean;
  showTransfers: boolean;
  setFilter: (key: string, value: unknown) => void;
  setShowTransactions: (value: boolean) => void;
  setShowTransfers: (value: boolean) => void;
  timeframe: { after: Moment; before: Moment };
  setTimeframe: (range: { after: Moment; before: Moment }) => void;
  isReversedOrder: boolean;
  setIsReversedOrder: (value: boolean) => void;
  /** Filters to render as disabled (e.g. when scoped to a specific account). */
  disabledFilters?: string[];
}

const H = 'h-7';
const TYPEAHEAD_W = 'w-[10rem]';
const AMOUNT_W = 'w-14';
const DATE_TEXT = 'max-w-32 truncate';
const TYPEAHEAD_JOINED = cn(
  'h-7 text-xs',
  TYPEAHEAD_W,
  '[&>div:first-child]:rounded-r-none [&>div:first-child]:border-r-0',
);

const Divider: React.FC = () => <span aria-hidden="true" className="hidden xl:block h-6 w-px bg-border mx-1" />;

export const ListingControls: React.FC<Props> = ({
  transactionFilters,
  transferFilters,
  showTransactions,
  showTransfers,
  setFilter,
  setShowTransactions,
  setShowTransfers,
  timeframe,
  setTimeframe,
  isReversedOrder,
  setIsReversedOrder,
  disabledFilters = [],
}) => {
  const {
    minLocal,
    maxLocal,
    searchLocal,
    handleMinChange,
    handleMaxChange,
    handleSearchChange,
    handleTimeframeChange,
    accountsValue,
    selectedCurrencies,
    viewMode,
    setViewMode,
    toggleNestedCategories,
  } = useFilterInputs({
    transactionFilters,
    transferFilters,
    showTransactions,
    showTransfers,
    setFilter,
    setShowTransactions,
    setShowTransfers,
    timeframe,
    setTimeframe,
  });

  const dateLabel = useMemo(
    () => `${timeframe.after.format('DD MMM')} – ${timeframe.before.format('DD MMM')}`,
    [timeframe.after, timeframe.before],
  );

  const OrderIcon = isReversedOrder ? CalendarArrowUp : CalendarArrowDown;

  return (
    <div className="min-w-0">
      <div
        aria-label="Ledger filters"
        role="toolbar"
        className="flex min-w-max flex-nowrap items-center gap-1 overflow-x-auto px-0 py-0"
      >
        {/* DATE + ORDER */}
        <div className="flex items-stretch">
          <DaterangePickerWithPresets
            after={timeframe.after}
            before={timeframe.before}
            onChange={handleTimeframeChange}
          >
            <Button
              size="sm"
              type="button"
              variant="outline"
              className={cn(H, 'bg-background px-1.5 text-xs rounded-r-none border-r-0')}
            >
              <CalendarIcon aria-hidden="true" className="mr-1 h-3.5 w-3.5 shrink-0" />
              <span className={DATE_TEXT}>{dateLabel}</span>
            </Button>
          </DaterangePickerWithPresets>
          <Tooltip delayDuration={1200}>
            <TooltipTrigger asChild>
              <Button
                aria-label="Toggle sort order"
                aria-pressed={isReversedOrder}
                size="icon"
                type="button"
                variant="outline"
                className="h-7 w-7 rounded-l-none border border-input shrink-0"
                onClick={() => setIsReversedOrder(!isReversedOrder)}
              >
                <OrderIcon aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle sort order</TooltipContent>
          </Tooltip>
        </div>

        <Divider />

        {/* TX / BOTH / XFER TOGGLE */}
        <div
          aria-label="View mode"
          role="group"
          className="flex items-stretch border rounded-md overflow-hidden shrink-0"
        >
          <Tooltip delayDuration={800}>
            <TooltipTrigger asChild>
              <Button
                aria-pressed={viewMode === 'transactions'}
                size="sm"
                type="button"
                variant={viewMode === 'transactions' ? 'secondary' : 'ghost'}
                className="h-7 rounded-none border-0 px-2 gap-1"
                onClick={() => setViewMode('transactions')}
              >
                <ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5 text-success" />
                <ArrowDownLeft aria-hidden="true" className="h-3.5 w-3.5 text-destructive -ml-2" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Transactions only</TooltipContent>
          </Tooltip>
          <span aria-hidden="true" className="w-px bg-border self-stretch" />
          <Tooltip delayDuration={800}>
            <TooltipTrigger asChild>
              <Button
                aria-pressed={viewMode === 'both'}
                size="sm"
                type="button"
                variant={viewMode === 'both' ? 'secondary' : 'ghost'}
                className="h-7 rounded-none border-0 px-2 text-xs font-normal"
                onClick={() => setViewMode('both')}
              >
                All
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show everything</TooltipContent>
          </Tooltip>
          <span aria-hidden="true" className="w-px bg-border self-stretch" />
          <Tooltip delayDuration={800}>
            <TooltipTrigger asChild>
              <Button
                aria-pressed={viewMode === 'transfers'}
                size="sm"
                type="button"
                variant={viewMode === 'transfers' ? 'secondary' : 'ghost'}
                className="h-7 rounded-none border-0 px-2 gap-1"
                onClick={() => setViewMode('transfers')}
              >
                <ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                <ArrowDownLeft aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground -ml-2" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Transfers only</TooltipContent>
          </Tooltip>
        </div>

        <Divider />

        {/* ACCOUNTS */}
        <div aria-label="Accounts filter" role="group" className={cn('flex items-center', TYPEAHEAD_W)}>
          <AccountTypeahead
            multiple
            disabled={disabledFilters.includes('accounts')}
            placeholder="Accounts"
            size="sm"
            value={accountsValue}
            className="w-full"
            onChange={(accounts) => setFilter('accounts', accounts)}
          />
        </div>

        <Divider />

        {/* CATEGORIES + NESTED */}
        <div aria-label="Categories filter" role="group" className="flex items-stretch">
          <CategoryTypeahead
            multiple
            disabled={disabledFilters.includes('categories')}
            placeholder="Categories"
            value={transactionFilters.categories as string[]}
            className={TYPEAHEAD_JOINED}
            onChange={(categories) => {
              setFilter('categories', categories);
              if (categories?.length) {
                setFilter('withNestedCategories', true);
                setShowTransactions(true);
                setShowTransfers(false);
              }
            }}
          />
          <Tooltip delayDuration={1200}>
            <TooltipTrigger asChild>
              <Button
                aria-label="Include nested categories"
                aria-pressed={transactionFilters.withNestedCategories}
                size="icon"
                type="button"
                variant={transactionFilters.withNestedCategories ? 'secondary' : 'outline'}
                className="h-7 w-7 rounded-l-none border border-input shrink-0"
                onClick={toggleNestedCategories}
              >
                <Layers aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Include nested categories</TooltipContent>
          </Tooltip>
        </div>

        <Divider />

        {/* AMOUNT RANGE */}
        <div aria-label="Amount range" role="group" className="flex items-center gap-1">
          <Input
            aria-label="Minimum amount"
            inputMode="decimal"
            placeholder="Min"
            type="number"
            value={minLocal}
            className={cn(H, AMOUNT_W, 'bg-background')}
            onChange={handleMinChange}
          />
          <span aria-hidden="true" className="text-muted-foreground text-xs">
            –
          </span>
          <Input
            aria-label="Maximum amount"
            inputMode="decimal"
            placeholder="Max"
            type="number"
            value={maxLocal}
            className={cn(H, AMOUNT_W, 'bg-background')}
            onChange={handleMaxChange}
          />
        </div>

        <Divider />

        {/* NOTE SEARCH */}
        <div className="relative flex items-center">
          <Search aria-hidden="true" className="absolute left-2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            aria-label="Search by note"
            placeholder="Search notes…"
            type="search"
            value={searchLocal}
            className={cn(H, 'bg-background pl-7 w-24 text-xs')}
            onChange={handleSearchChange}
          />
        </div>

        <Divider />

        {/* DRAFT STATUS FILTER */}
        <div
          aria-label="Draft status filter"
          role="group"
          className="flex items-stretch border rounded-md overflow-hidden shrink-0"
        >
          <Button
            aria-pressed={transactionFilters.isDraft === undefined}
            size="sm"
            type="button"
            variant={transactionFilters.isDraft === undefined ? 'secondary' : 'ghost'}
            className="h-7 rounded-none border-0 px-2 text-xs font-normal"
            onClick={() => setFilter('isDraft', undefined)}
          >
            All
          </Button>
          <span aria-hidden="true" className="w-px bg-border self-stretch" />
          <Button
            aria-pressed={transactionFilters.isDraft === true}
            size="sm"
            type="button"
            variant={transactionFilters.isDraft === true ? 'secondary' : 'ghost'}
            className="h-7 rounded-none border-0 px-2 text-xs font-normal"
            onClick={() => setFilter('isDraft', true)}
          >
            Drafts
          </Button>
          <span aria-hidden="true" className="w-px bg-border self-stretch" />
          <Button
            aria-pressed={transactionFilters.isDraft === false}
            size="sm"
            type="button"
            variant={transactionFilters.isDraft === false ? 'secondary' : 'ghost'}
            className="h-7 rounded-none border-0 px-2 text-xs font-normal"
            onClick={() => setFilter('isDraft', false)}
          >
            Confirmed
          </Button>
        </div>

        <Divider />

        {/* CURRENCY MULTISELECT */}
        <div aria-label="Currency filter" role="group">
          <MultiSelect
            maxCount={2}
            options={CURRENCY_OPTIONS}
            placeholder="Currency"
            value={selectedCurrencies}
            className={cn(H, 'bg-background text-xs min-w-[6rem] max-w-[10rem] border-input')}
            onValueChange={(values) => setFilter('currencies', values.length ? values : undefined)}
          />
        </div>
      </div>
    </div>
  );
};

export default ListingControls;
