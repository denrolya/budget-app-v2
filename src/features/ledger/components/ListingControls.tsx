import debounce from 'lodash/debounce';
import {
  ArrowDownLeft,
  ArrowDownRight,
  CalendarArrowDown,
  CalendarArrowUp,
  CalendarIcon,
  FileText,
  Layers,
  Search,
} from 'lucide-react';
import { type Moment } from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { SEARCH_DEBOUNCE_MS } from '@/constants/ui';
import { type TransactionFilters } from '@/features/transactions';
import { type TransferFilters } from '@/features/transfers';
import { cn } from '@/lib/utils';
import { type Timeframe } from '@/types/global';

type ViewMode = 'transactions' | 'both' | 'transfers';

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

const H = 'h-9';
const TYPEAHEAD_W = 'w-[14rem]';
const AMOUNT_W = 'w-20';
const DATE_TEXT = 'max-w-40 truncate';
const TYPEAHEAD_JOINED = cn(TYPEAHEAD_W, '[&>div:first-child]:rounded-r-none [&>div:first-child]:border-r-0');

const Divider: React.FC = () => <span aria-hidden="true" className="hidden xl:block h-6 w-px bg-border mx-1" />;

const CURRENCY_OPTIONS = (Object.keys(CURRENCIES) as CURRENCY_CODE[]).map((code) => ({
  value: code,
  label: `${CURRENCIES[code].symbol} ${code}`,
}));

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
  const [minLocal, setMinLocal] = useState('');
  const [maxLocal, setMaxLocal] = useState('');
  const [searchLocal, setSearchLocal] = useState(transactionFilters.searchTerm ?? '');

  const debouncedAmount = useRef(
    debounce((minStr: string, maxStr: string) => {
      const min = minStr === '' ? NaN : Number(minStr);
      const max = maxStr === '' ? NaN : Number(maxStr);
      if (!Number.isFinite(min) && !Number.isFinite(max)) {
        setFilter('amountRange', []);
        return;
      }
      setFilter('amountRange', [min, max]);
    }, 350),
  ).current;

  const debouncedSearch = useRef(debounce((value: string) => setFilter('searchTerm', value), SEARCH_DEBOUNCE_MS)).current;

  useEffect(
    () => () => {
      debouncedAmount.cancel();
      debouncedSearch.cancel();
    },
    [debouncedAmount, debouncedSearch],
  );

  useEffect(() => {
    const [extMin, extMax] = transactionFilters.amountRange ?? [];
    setMinLocal((p) => {
      const n = extMin != null && Number.isFinite(extMin) ? String(extMin) : '';
      return p === n ? p : n;
    });
    setMaxLocal((p) => {
      const n = extMax != null && Number.isFinite(extMax) ? String(extMax) : '';
      return p === n ? p : n;
    });
  }, [transactionFilters.amountRange]);

  useEffect(() => {
    setSearchLocal(transactionFilters.searchTerm ?? '');
  }, [transactionFilters.searchTerm]);

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMinLocal(e.target.value);
      debouncedAmount(e.target.value, maxLocal);
    },
    [debouncedAmount, maxLocal],
  );
  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMaxLocal(e.target.value);
      debouncedAmount(minLocal, e.target.value);
    },
    [debouncedAmount, minLocal],
  );
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchLocal(e.target.value);
      debouncedSearch(e.target.value);
    },
    [debouncedSearch],
  );

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: range.after ? range.after.clone().startOf('day') : timeframe.after,
        before: range.before ? range.before.clone().endOf('day') : timeframe.before,
      });
    },
    [setTimeframe, timeframe.after, timeframe.before],
  );

  const dateLabel = useMemo(
    () => `${timeframe.after.format('DD MMM')} – ${timeframe.before.format('DD MMM')}`,
    [timeframe.after, timeframe.before],
  );

  const toggleNestedCategories = useCallback(() => {
    setFilter('withNestedCategories', !transactionFilters.withNestedCategories);
  }, [setFilter, transactionFilters.withNestedCategories]);

  const toggleDraftOnly = useCallback(() => {
    const next =
      transactionFilters.isDraft === undefined ? true : transactionFilters.isDraft === true ? false : undefined;
    setFilter('isDraft', next);
  }, [setFilter, transactionFilters.isDraft]);

  // ─ Accounts ──────────────────────────────────────────────────────────────
  const accountsValue = useMemo(() => {
    const t = Array.isArray(transactionFilters.accounts) ? transactionFilters.accounts : [];
    const tr = Array.isArray(transferFilters.accounts) ? transferFilters.accounts : [];
    return [...new Set([...t, ...tr])];
  }, [transactionFilters.accounts, transferFilters.accounts]);

  // ─ Currency MultiSelect ───────────────────────────────────────────────────
  const selectedCurrencies: string[] = useMemo(
    () => transactionFilters.currencies ?? [],
    [transactionFilters],
  );

  const handleCurrencyChange = useCallback(
    (values: string[]) => setFilter('currencies', values.length ? values : undefined),
    [setFilter],
  );

  // ─ 3-way view toggle ─────────────────────────────────────────────────────
  const viewMode: ViewMode = useMemo(() => {
    if (showTransactions && !showTransfers) return 'transactions';
    if (!showTransactions && showTransfers) return 'transfers';
    return 'both';
  }, [showTransactions, showTransfers]);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      if (mode === 'transactions') {
        setShowTransactions(true);
        setShowTransfers(false);
      } else if (mode === 'transfers') {
        setShowTransactions(false);
        setShowTransfers(true);
      } else {
        setShowTransactions(true);
        setShowTransfers(true);
      }
    },
    [setShowTransactions, setShowTransfers],
  );

  const OrderIcon = isReversedOrder ? CalendarArrowUp : CalendarArrowDown;

  return (
    <div className="min-w-0">
      <div
        aria-label="Ledger filters"
        role="toolbar"
        className="flex min-w-max flex-nowrap items-center gap-1.5 overflow-x-auto px-0 py-0"
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
              className={cn(H, 'bg-background px-2 rounded-r-none border-r-0')}
            >
              <CalendarIcon aria-hidden="true" className="mr-1.5 h-4 w-4 shrink-0" />
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
                className="h-9 w-9 rounded-l-none border border-input shrink-0"
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
                className="h-9 rounded-none border-0 px-2.5 gap-1"
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
                className="h-9 rounded-none border-0 px-2.5 text-xs font-normal"
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
                className="h-9 rounded-none border-0 px-2.5 gap-1"
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
                className="h-9 w-9 rounded-l-none border border-input shrink-0"
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
          <Search
            aria-hidden="true"
            className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
          />
          <Input
            aria-label="Search by note"
            placeholder="Search notes…"
            type="search"
            value={searchLocal}
            className={cn(H, 'bg-background pl-8 w-36')}
            onChange={handleSearchChange}
          />
        </div>

        <Divider />

        {/* DRAFTS TOGGLE */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-pressed={transactionFilters.isDraft !== undefined}
              size="sm"
              type="button"
              variant={transactionFilters.isDraft !== undefined ? 'secondary' : 'outline'}
              aria-label={
                transactionFilters.isDraft === undefined
                  ? 'Show drafts only'
                  : transactionFilters.isDraft
                    ? 'Showing drafts only'
                    : 'Showing non-drafts only'
              }
              className={cn(H, 'px-2 gap-1')}
              onClick={toggleDraftOnly}
            >
              <FileText aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="text-xs">{transactionFilters.isDraft === false ? 'No drafts' : 'Drafts'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {transactionFilters.isDraft === undefined
              ? 'Show drafts only'
              : transactionFilters.isDraft
                ? 'Showing drafts — click for non-drafts'
                : 'Showing non-drafts — click to clear'}
          </TooltipContent>
        </Tooltip>

        <Divider />

        {/* CURRENCY MULTISELECT */}
        <div aria-label="Currency filter" role="group">
          <MultiSelect
            maxCount={2}
            options={CURRENCY_OPTIONS}
            placeholder="Currency"
            value={selectedCurrencies}
            className={cn(H, 'bg-background text-xs min-w-[7rem] max-w-[12rem] border-input')}
            onValueChange={handleCurrencyChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ListingControls;
