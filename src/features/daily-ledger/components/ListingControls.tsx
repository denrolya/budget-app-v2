import debounce from 'lodash/debounce';
import { CalendarArrowDown, CalendarArrowUp, CalendarIcon, FileText, Layers, RotateCcw } from 'lucide-react';
import { Moment } from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import CategoryTypeahead from '@/features/categories/components/CategoryTypeahead';
import DisplayMenu from '@/features/daily-ledger/components/DisplayMenu';
import { Type as TransactionType } from '@/features/transactions';
import { TransactionFilters } from '@/features/transactions/models/TransactionFilters';
import { TransferFilters } from '@/features/transfers/models/TransferFilters';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Timeframe } from '@/types/global';

type CombinedFilters =
  TransactionFilters &
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
const TYPEAHEAD_W = 'w-[18rem]';
const AMOUNT_W = 'w-24';
const DATE_TEXT = 'max-w-44 truncate';
const CURRENCY_W = 'w-[14rem]';

const Divider: React.FC = () => (
  <span aria-hidden="true" className="hidden md:block h-6 w-px bg-border mx-1.5" />
);

const isCurrencyCode = (v: unknown): v is CURRENCY_CODE => typeof v === 'string' && v in CURRENCIES;

const toCurrencyCodes = (value: unknown): CURRENCY_CODE[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(isCurrencyCode);
  if (isCurrencyCode(value)) return [value];
  return [];
};

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

  const accountsValue = useMemo(() => {
    const t = Array.isArray(transactionFilters.accounts) ? transactionFilters.accounts : [];
    const tr = Array.isArray(transferFilters.accounts) ? transferFilters.accounts : [];
    return [...new Set([...t, ...tr])];
  }, [transactionFilters.accounts, transferFilters.accounts]);

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

  const currencyCodes = useMemo(() => toCurrencyCodes((transactionFilters as any).currencies), [transactionFilters]);

  const toggleCurrency = useCallback(
    (code: CURRENCY_CODE) => {
      const next = currencyCodes.includes(code)
        ? currencyCodes.filter((c) => c !== code)
        : [...currencyCodes, code];

      setFilter('currencies' as keyof CombinedFilters, next.length ? next : undefined);
    },
    [currencyCodes, setFilter],
  );

  const clearCurrencies = useCallback(() => {
    setFilter('currencies' as keyof CombinedFilters, undefined);
  }, [setFilter]);

  const currencyLabel = useMemo(() => {
    if (!currencyCodes.length) return 'Currencies';
    if (currencyCodes.length === 1) {
      const c = CURRENCIES[currencyCodes[0]];
      return `${c.symbol} ${c.code}`;
    }
    return `Currencies (${currencyCodes.length})`;
  }, [currencyCodes]);

  const canReset = Boolean(transactionFilters.activeCount) && !isLoading;

  // -----------------------------
  // Amount range: local + debounced commit (keeps query params updating)
  // -----------------------------
  const [minLocal, setMinLocal] = useState('');
  const [maxLocal, setMaxLocal] = useState('');

  // sync external -> local (reset / initial load / back-forward navigation)
  useEffect(() => {
    const [extMin, extMax] = transactionFilters.amountRange ?? [];
    const nextMin = extMin != null ? String(extMin) : '';
    const nextMax = extMax != null ? String(extMax) : '';

    // avoid caret jumps / redundant updates
    setMinLocal((p) => (p === nextMin ? p : nextMin));
    setMaxLocal((p) => (p === nextMax ? p : nextMax));
  }, [transactionFilters.amountRange]);

  const debouncedCommitAmountRange = useMemo(
    () =>
      debounce((minStr: string, maxStr: string) => {
        const minRaw = minStr.trim();
        const maxRaw = maxStr.trim();

        const minParsed = minRaw === '' ? undefined : Number(minRaw);
        const maxParsed = maxRaw === '' ? undefined : Number(maxRaw);

        const min = Number.isFinite(minParsed as number) ? (minParsed as number) : undefined;
        const max = Number.isFinite(maxParsed as number) ? (maxParsed as number) : undefined;

        setFilter('amountRange', [min, max] as any);
      }, 350),
    [setFilter],
  );

  useEffect(() => () => debouncedCommitAmountRange.cancel(), [debouncedCommitAmountRange]);

  const onMinChange = useCallback(
    (v: string) => {
      setMinLocal(v);
      debouncedCommitAmountRange(v, maxLocal);
    },
    [debouncedCommitAmountRange, maxLocal],
  );

  const onMaxChange = useCallback(
    (v: string) => {
      setMaxLocal(v);
      debouncedCommitAmountRange(minLocal, v);
    },
    [debouncedCommitAmountRange, minLocal],
  );

  return (
    <div className="border-b bg-muted/30 supports-[backdrop-filter]:bg-muted/30">
      <div
        aria-label="Ledger filters"
        role="toolbar"
        className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2"
      >
        <div className="flex items-center gap-1.5">
          <div aria-label="Date range" role="group" className="flex items-center">
            <DaterangePickerWithPresets
              after={timeframe.after}
              before={timeframe.before}
              onChange={handleTimeframeChange}>
              <Button
                aria-label="Select date range"
                size="sm"
                type="button"
                variant="outline"
                className={cn(H, 'bg-background px-2')}
              >
                <CalendarIcon aria-hidden="true" className="mr-1.5 h-4 w-4" />
                <span className={DATE_TEXT}>{dateLabel}</span>
              </Button>
            </DaterangePickerWithPresets>
          </div>

          {showOrderToggle && (
            <Tooltip delayDuration={1500}>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Toggle ordering"
                  aria-pressed={isReversedOrder}
                  size="icon"
                  type="button"
                  variant="outline"
                  className={ICON_BTN}
                  onClick={() => setIsReversedOrder(!isReversedOrder)}
                >
                  <OrderIcon aria-hidden="true" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle ordering</TooltipContent>
            </Tooltip>
          )}
        </div>

        <Divider />

        <div className="flex items-center gap-1.5">
          <div aria-label="Accounts filter" role="group" className={cn('flex items-center', TYPEAHEAD_W)}>
            <AccountTypeahead
              multiple
              aria-label="Filter by accounts"
              placeholder="Accounts"
              value={accountsValue}
              className="w-full"
              onChange={(accounts) => setFilter('accounts', accounts)}
            />
          </div>

          <Divider />

          <div aria-label="Categories filter" role="group" className={cn('flex items-center', TYPEAHEAD_W)}>
            <CategoryTypeahead
              multiple
              aria-label="Filter by categories"
              placeholder="Categories"
              value={transactionFilters.categories}
              className="w-full"
              onChange={(categories) => {
                setFilter('categories', categories);
                if (categories?.length) {
                  setShowTransactions(true);
                  setShowTransfers(false);
                }
              }}
            />
          </div>

          <Tooltip delayDuration={1500}>
            <TooltipTrigger asChild>
              <Button
                aria-label="Nested categories"
                aria-pressed={transactionFilters.withNestedCategories}
                size="icon"
                type="button"
                variant={transactionFilters.withNestedCategories ? 'secondary' : 'outline'}
                className={ICON_BTN}
                onClick={toggleNestedCategories}
              >
                <Layers aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Nested categories</TooltipContent>
          </Tooltip>

          <Divider />

          <div aria-label="Currencies filter" role="group" className={cn('flex items-center', CURRENCY_W)}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  aria-label="Filter by currencies"
                  type="button"
                  variant="outline"
                  className={cn(H, 'bg-background w-full justify-between px-2 font-normal')}
                >
                  <span className="truncate">{currencyLabel}</span>
                  {currencyCodes.length ? (
                    <span className="ml-2 text-xs text-muted-foreground shrink-0">{currencyCodes.join(', ')}</span>
                  ) : null}
                </Button>
              </PopoverTrigger>

              <PopoverContent align="start" className="w-[18rem] p-2">
                <div className="flex items-center justify-between gap-2 px-1 pb-2">
                  <div className="text-sm font-medium">Currencies</div>
                  <Button
                    aria-label="Clear currencies filter"
                    disabled={!currencyCodes.length}
                    size="sm"
                    type="button"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={clearCurrencies}
                  >
                    Clear
                  </Button>
                </div>

                <Separator />

                <ScrollArea className="h-[220px]">
                  <div className="py-2 space-y-1">
                    {(Object.keys(CURRENCIES) as CURRENCY_CODE[]).map((code) => {
                      const c = CURRENCIES[code];
                      const selected = currencyCodes.includes(code);
                      return (
                        <Button
                          aria-label={`Toggle currency ${code}`}
                          aria-pressed={selected}
                          type="button"
                          variant={selected ? 'secondary' : 'ghost'}
                          className="w-full justify-start h-9 px-2 font-normal"
                          key={code}
                          onClick={() => toggleCurrency(code)}
                        >
                          <span className="mr-2 text-sm">{c.symbol}</span>
                          <span className="mr-2 font-mono text-xs">{c.code}</span>
                          <span className="truncate text-sm text-muted-foreground">{c.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Divider />

        <div className="flex items-center gap-1.5">
          <div aria-label="Amount range" role="group" className="flex items-center gap-1.5">
            <Input
              aria-label="Minimum amount"
              inputMode="decimal"
              placeholder="Min"
              type="number"
              value={minLocal}
              className={cn(H, AMOUNT_W, 'bg-background')}
              onChange={(e) => onMinChange(e.target.value)}
            />
            <Input
              aria-label="Maximum amount"
              inputMode="decimal"
              placeholder="Max"
              type="number"
              value={maxLocal}
              className={cn(H, AMOUNT_W, 'bg-background')}
              onChange={(e) => onMaxChange(e.target.value)}
            />
          </div>

          <Divider />

          <div aria-label="Transaction type" role="group" className={cn('flex items-center', H)}>
            <div className={cn('flex items-stretch overflow-hidden rounded-md border bg-background', H)}>
              <Button
                aria-pressed={isIncome}
                size="sm"
                type="button"
                variant={isIncome ? 'success' : 'ghost'}
                className="h-full rounded-none px-2"
                onClick={() => setType(TransactionType.Income)}
              >
                Income
              </Button>

              <div aria-hidden="true" className="self-center h-5 w-px bg-border" />

              <Button
                aria-pressed={isExpense}
                size="sm"
                type="button"
                variant={isExpense ? 'destructive' : 'ghost'}
                className="h-full rounded-none px-2"
                onClick={() => setType(TransactionType.Expense)}
              >
                Expense
              </Button>
            </div>
          </div>

          <Divider />

          <Tooltip delayDuration={1500}>
            <TooltipTrigger asChild>
              <Button
                aria-label="Only drafts"
                aria-pressed={transactionFilters.isDraft}
                size="icon"
                type="button"
                variant={transactionFilters.isDraft ? 'secondary' : 'outline'}
                className={ICON_BTN}
                onClick={toggleDraft}
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Only drafts</TooltipContent>
          </Tooltip>
        </div>

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

          <Tooltip delayDuration={1500}>
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
