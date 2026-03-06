import debounce from 'lodash/debounce';
import { CalendarArrowDown, CalendarArrowUp, CalendarIcon, ChevronDown, Layers, RotateCcw, Search, X } from 'lucide-react';
import { Moment } from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import CategoryTypeahead from '@/features/categories/components/CategoryTypeahead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import DisplayMenu from '@/features/daily-ledger/components/DisplayMenu';
import { TransactionFilters } from '@/features/transactions/models/TransactionFilters';
import { TransferFilters } from '@/features/transfers/models/TransferFilters';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Timeframe } from '@/types/global';

type CombinedFilters = TransactionFilters &
  TransferFilters & {
    after: Moment;
    before: Moment;
  };

interface Props {
  isLoading?: boolean;
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  setFilter: <K extends keyof CombinedFilters>(key: K, value: CombinedFilters[K]) => void;
  setShowTransactions: (value: boolean) => void;
  setShowTransfers: (value: boolean) => void;
  timeframe: { after: Moment; before: Moment };
  setTimeframe: (range: { after: Moment; before: Moment }) => void;
  activeView: 'table' | 'list';
  isReversedOrder: boolean;
  setIsReversedOrder: (value: boolean) => void;
  handleResetFilters: () => void;
  onFiltersDialogToggle: () => void;
  isCompactTable: boolean;
  setActiveView: (value: 'table' | 'list') => void;
  setIsCompactTable: (value: boolean) => void;
  setShowEmptyDays: (value: boolean) => void;
  showEmptyDays: boolean;
  showTransactions: boolean;
  showTransfers: boolean;
}

const H = 'h-9';
const ICON_BTN = cn(H, 'w-9');
const TYPEAHEAD_W = 'w-[14rem]';
const AMOUNT_W = 'w-20';
const DATE_TEXT = 'max-w-40 truncate';

// Connects the category typeahead's right edge to the nested-toggle button.
const TYPEAHEAD_JOINED = cn(TYPEAHEAD_W, '[&>div:first-child]:rounded-r-none [&>div:first-child]:border-r-0');

const Divider: React.FC = () => (
  <span aria-hidden="true" className="hidden xl:block h-6 w-px bg-border mx-1" />
);

const CURRENCY_CODES = Object.keys(CURRENCIES) as CURRENCY_CODE[];

export const ListingControls: React.FC<Props> = ({
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
  isCompactTable,
  showTransfers,
  setActiveView,
  setIsCompactTable,
  showTransactions,
  setShowEmptyDays,
  showEmptyDays,
}) => {
  const isMobile = useIsMobile();

  // --- Amount range: local strings + debounced commit ---
  const [minLocal, setMinLocal] = useState('');
  const [maxLocal, setMaxLocal] = useState('');
  const [searchLocal, setSearchLocal] = useState(transactionFilters.searchTerm ?? '');

  const debouncedAmount = useRef(
    debounce((minStr: string, maxStr: string) => {
      const min = minStr === '' ? NaN : Number(minStr);
      const max = maxStr === '' ? NaN : Number(maxStr);
      if (!Number.isFinite(min) && !Number.isFinite(max)) {
        setFilter('amountRange' as keyof CombinedFilters, [] as any);
        return;
      }
      setFilter('amountRange' as keyof CombinedFilters, [min, max] as any);
    }, 350),
  ).current;

  const debouncedSearch = useRef(
    debounce((value: string) => {
      setFilter('searchTerm' as keyof CombinedFilters, value as any);
    }, 250),
  ).current;

  useEffect(() => () => { debouncedAmount.cancel(); debouncedSearch.cancel(); }, [debouncedAmount, debouncedSearch]);

  // Sync external amount → local
  useEffect(() => {
    const [extMin, extMax] = transactionFilters.amountRange ?? [];
    setMinLocal((p) => { const n = (extMin != null && Number.isFinite(extMin)) ? String(extMin) : ''; return p === n ? p : n; });
    setMaxLocal((p) => { const n = (extMax != null && Number.isFinite(extMax)) ? String(extMax) : ''; return p === n ? p : n; });
  }, [transactionFilters.amountRange]);

  useEffect(() => {
    setSearchLocal(transactionFilters.searchTerm ?? '');
  }, [transactionFilters.searchTerm]);

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMinLocal(e.target.value);
    debouncedAmount(e.target.value, maxLocal);
  }, [debouncedAmount, maxLocal]);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxLocal(e.target.value);
    debouncedAmount(minLocal, e.target.value);
  }, [debouncedAmount, minLocal]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchLocal(e.target.value);
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

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
    setFilter('withNestedCategories' as keyof CombinedFilters, !transactionFilters.withNestedCategories as any);
  }, [setFilter, transactionFilters.withNestedCategories]);

  const selectedCurrencies: string[] = useMemo(() => (transactionFilters as any).currencies ?? [], [transactionFilters]);

  const toggleCurrency = useCallback((code: CURRENCY_CODE) => {
    const next = selectedCurrencies.includes(code)
      ? selectedCurrencies.filter((c: string) => c !== code)
      : [...selectedCurrencies, code];
    setFilter('currencies' as keyof CombinedFilters, (next.length ? next : undefined) as any);
  }, [selectedCurrencies, setFilter]);

  const clearCurrencies = useCallback(() => {
    setFilter('currencies' as keyof CombinedFilters, undefined as any);
  }, [setFilter]);

  const currencyLabel = useMemo(() => {
    if (selectedCurrencies.length === 0) return 'Currency';
    if (selectedCurrencies.length <= 2) return selectedCurrencies.map((c) => CURRENCIES[c as CURRENCY_CODE]?.symbol ?? c).join(' ');
    return `${selectedCurrencies.length} currencies`;
  }, [selectedCurrencies]);

  // Merged accounts value (union of tx + transfer accounts)
  const accountsValue = useMemo(() => {
    const t = Array.isArray(transactionFilters.accounts) ? transactionFilters.accounts : [];
    const tr = Array.isArray(transferFilters.accounts) ? transferFilters.accounts : [];
    return [...new Set([...t, ...tr])];
  }, [transactionFilters.accounts, transferFilters.accounts]);

  const showOrderToggle = activeView === 'table';
  const OrderIcon = isReversedOrder ? CalendarArrowUp : CalendarArrowDown;
  const canReset = Boolean(transactionFilters.activeCount) && !isLoading;

  return (
    <div className="border-b bg-muted/30 supports-[backdrop-filter]:bg-muted/30">
      <div
        aria-label="Ledger filters"
        role="toolbar"
        className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2"
      >
        {/* DATE + ORDER — visually joined as input-group */}
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
              className={cn(H, 'bg-background px-2', showOrderToggle && 'rounded-r-none border-r-0')}
            >
              <CalendarIcon aria-hidden="true" className="mr-1.5 h-4 w-4 shrink-0" />
              <span className={DATE_TEXT}>{dateLabel}</span>
            </Button>
          </DaterangePickerWithPresets>

          {showOrderToggle && (
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
          )}
        </div>

        <Divider />

        {/* ACCOUNTS */}
        <div aria-label="Accounts filter" role="group" className={cn('flex items-center', TYPEAHEAD_W)}>
          <AccountTypeahead
            multiple
            placeholder="Accounts"
            value={accountsValue}
            className="w-full"
            onChange={(accounts) => setFilter('accounts' as keyof CombinedFilters, accounts as any)}
          />
        </div>

        <Divider />

        {/* CATEGORIES + NESTED BTN-GROUP */}
        <div aria-label="Categories filter" role="group" className="flex items-stretch">
          <CategoryTypeahead
            multiple
            placeholder="Categories"
            value={transactionFilters.categories}
            className={TYPEAHEAD_JOINED}
            onChange={(categories) => {
              setFilter('categories' as keyof CombinedFilters, categories as any);
              if (categories?.length) {
                setFilter('withNestedCategories' as keyof CombinedFilters, true as any);
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
          <span aria-hidden="true" className="text-muted-foreground text-xs">–</span>
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
          <Search aria-hidden="true" className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
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

        {/* CURRENCY DROPDOWN */}
        <div aria-label="Currency filter" role="group" className="flex items-stretch">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={selectedCurrencies.length > 0 ? 'secondary' : 'outline'}
                className={cn(H, 'bg-background px-2 gap-1', selectedCurrencies.length > 0 && 'rounded-r-none border-r-0')}
              >
                <span className="text-xs">{currencyLabel}</span>
                <ChevronDown aria-hidden="true" className="h-3 w-3 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {CURRENCY_CODES.map((code) => {
                const c = CURRENCIES[code];
                return (
                  <DropdownMenuCheckboxItem
                    checked={selectedCurrencies.includes(code)}
                    key={code}
                    onCheckedChange={() => toggleCurrency(code)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="mr-2 w-5 text-center text-sm">{c.symbol}</span>
                    <span className="font-mono text-xs mr-2">{c.code}</span>
                    <span className="truncate text-xs text-muted-foreground">{c.name}</span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedCurrencies.length > 0 && (
            <Button
              aria-label="Clear currency filter"
              size="icon"
              type="button"
              variant="secondary"
              className="h-9 w-7 rounded-l-none border border-l-0 border-input shrink-0"
              onClick={clearCurrencies}
            >
              <X aria-hidden="true" className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* RIGHT: DISPLAY MENU + RESET + FILTERS TOGGLE */}
        <div className="ml-0 md:ml-auto flex items-center gap-1.5">
          {!isMobile && (
            <DisplayMenu
              activeView={activeView}
              isCompactTable={isCompactTable}
              isReversedOrder={isReversedOrder}
              setActiveView={setActiveView}
              setFilter={setFilter}
              setIsCompactTable={setIsCompactTable}
              setIsReversedOrder={setIsReversedOrder}
              setShowEmpty={setShowEmptyDays}
              setShowTransactions={setShowTransactions}
              setShowTransfers={setShowTransfers}
              showEmpty={showEmptyDays}
              showTransactions={showTransactions}
              showTransfers={showTransfers}
              transactionFilters={transactionFilters}
            />
          )}

          <Tooltip delayDuration={1200}>
            <TooltipTrigger asChild>
              <Button
                aria-label="Reset filters"
                disabled={!canReset}
                size="icon"
                type="button"
                variant="outline"
                className={ICON_BTN}
                onClick={handleResetFilters}
              >
                <RotateCcw aria-hidden="true" className={cn('h-4 w-4', isLoading && 'animate-spin')} />
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
