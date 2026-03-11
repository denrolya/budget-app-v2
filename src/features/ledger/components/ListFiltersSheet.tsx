import debounce from 'lodash/debounce';
import {
  AlignJustify,
  ArrowDownCircle,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpCircle,
  CalendarIcon,
  FileText,
  Layers,
  Minimize2,
  Search,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import { DebtTypeahead } from '@/features/debts';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { FILTER_PRESETS } from '@/constants/datetime';
import { TransactionFilters } from '@/features/transactions';
import { Type as TransactionType } from '@/features/transactions';
import { TransferFilters } from '@/features/transfers';
import { Timeframe } from '@/types/global';
import { cn } from '@/lib/utils';

type ViewMode = 'transactions' | 'both' | 'transfers';

interface ListFiltersContentProps {
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  setFilter: (key: string, value: any) => void;
  showTransactions: boolean;
  showTransfers: boolean;
  setShowTransactions: (value: boolean) => void;
  setShowTransfers: (value: boolean) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  isCompactTable: boolean;
  setIsCompactTable: (v: boolean) => void;
  showEmptyDays: boolean;
  setShowEmptyDays: (v: boolean) => void;
  disabledFilters?: string[];
  onReset?: () => void;
}

interface ListFiltersSheetProps extends ListFiltersContentProps {
  isOpen?: boolean;
  setIsOpen: (value: boolean) => void;
}

const CURRENCY_CODES = Object.keys(CURRENCIES) as CURRENCY_CODE[];
const CURRENCY_OPTIONS = CURRENCY_CODES.map((code) => ({ value: code, label: `${CURRENCIES[code].symbol} ${code}` }));

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground mb-2">{children}</p>
);

const ListFiltersContent: React.FC<ListFiltersContentProps> = ({
  transactionFilters,
  transferFilters,
  setFilter,
  showTransactions,
  showTransfers,
  setShowTransactions,
  setShowTransfers,
  timeframe,
  setTimeframe,
  isCompactTable,
  setIsCompactTable,
  showEmptyDays,
  setShowEmptyDays,
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
        setFilter('amountRange', [] as any);
        return;
      }
      setFilter('amountRange', [min, max] as any);
    }, 350),
  ).current;

  const debouncedSearch = useRef(debounce((value: string) => setFilter('searchTerm', value as any), 250)).current;

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
    () => `${timeframe.after.format('DD MMM YYYY')} – ${timeframe.before.format('DD MMM YYYY')}`,
    [timeframe.after, timeframe.before],
  );

  const accountsValue = useMemo(() => {
    const t = Array.isArray(transactionFilters.accounts) ? transactionFilters.accounts : [];
    const tr = Array.isArray(transferFilters.accounts) ? transferFilters.accounts : [];
    return [...new Set([...t, ...tr])];
  }, [transactionFilters.accounts, transferFilters.accounts]);

  const selectedCurrencies: string[] = useMemo(
    () => (transactionFilters as any).currencies ?? [],
    [transactionFilters],
  );

  const setType = useCallback(
    (type: TransactionType) => {
      setFilter('type', transactionFilters.type === type ? undefined : type);
    },
    [setFilter, transactionFilters.type],
  );
  const setDraftFilter = useCallback(
    (value: boolean) => {
      setFilter('isDraft', transactionFilters.isDraft === value ? undefined : value);
    },
    [setFilter, transactionFilters.isDraft],
  );
  const toggleNestedCategories = useCallback(() => {
    setFilter('withNestedCategories', !transactionFilters.withNestedCategories);
  }, [setFilter, transactionFilters.withNestedCategories]);

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

  return (
    <div className="space-y-5">
      {/* ── Date & Search ── */}
      <div className="space-y-2">
        <SectionLabel>When</SectionLabel>
        <DaterangePickerWithPresets
          after={timeframe.after}
          before={timeframe.before}
          presets={FILTER_PRESETS}
          onChange={handleTimeframeChange}
        >
          <Button size="sm" type="button" variant="outline" className="w-full justify-start bg-background h-8 px-2">
            <CalendarIcon aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs">{dateLabel}</span>
          </Button>
        </DaterangePickerWithPresets>

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
            className="bg-background pl-8 h-8 text-sm"
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* ── Entities ── */}
      <div className="space-y-2">
        <SectionLabel>Narrow by</SectionLabel>

        <AccountTypeahead
          multiple
          disabled={disabledFilters.includes('accounts')}
          placeholder="All accounts"
          value={accountsValue}
          className="w-full"
          onChange={(accounts) => setFilter('accounts' as any, accounts as any)}
        />

        <div className="flex items-stretch">
          <CategoryTypeahead
            multiple
            disabled={disabledFilters.includes('categories')}
            placeholder="All categories"
            value={transactionFilters.categories as string[]}
            className="flex-1 [&>div:first-child]:rounded-r-none [&>div:first-child]:border-r-0"
            onChange={(categories) => {
              setFilter('categories' as any, categories as any);
              if (categories?.length) {
                setFilter('withNestedCategories' as any, true);
                setShowTransactions(true);
                setShowTransfers(false);
              }
            }}
          />
          <Tooltip>
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

        <DebtTypeahead
          multiple
          disabled={disabledFilters.includes('debts')}
          placeholder="All debts"
          value={transactionFilters.debts as string[]}
          className="w-full"
          onChange={(debts) => setFilter('debts' as any, debts as any)}
        />
      </div>

      {/* ── Transaction filters ── */}
      <div className="space-y-2">
        <SectionLabel>Filter by</SectionLabel>

        {/* Show mode */}
        <div className="flex border rounded-md overflow-hidden">
          <Button
            aria-pressed={viewMode === 'transactions'}
            size="sm"
            type="button"
            variant={viewMode === 'transactions' ? 'secondary' : 'ghost'}
            className="flex-1 h-8 rounded-none border-0 gap-1"
            onClick={() => setViewMode('transactions')}
          >
            <ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5 text-success" />
            <ArrowDownLeft aria-hidden="true" className="h-3.5 w-3.5 text-destructive -ml-2" />
            <span className="text-xs">Tx</span>
          </Button>
          <span className="w-px bg-border self-stretch" />
          <Button
            aria-pressed={viewMode === 'both'}
            size="sm"
            type="button"
            variant={viewMode === 'both' ? 'secondary' : 'ghost'}
            className="flex-1 h-8 rounded-none border-0 text-xs"
            onClick={() => setViewMode('both')}
          >
            All
          </Button>
          <span className="w-px bg-border self-stretch" />
          <Button
            aria-pressed={viewMode === 'transfers'}
            size="sm"
            type="button"
            variant={viewMode === 'transfers' ? 'secondary' : 'ghost'}
            className="flex-1 h-8 rounded-none border-0 gap-1"
            onClick={() => setViewMode('transfers')}
          >
            <ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
            <ArrowDownLeft aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground -ml-2" />
            <span className="text-xs">Xfer</span>
          </Button>
        </div>

        {/* Type + Status in a 2-col grid */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            aria-pressed={transactionFilters.type === TransactionType.Income}
            size="sm"
            type="button"
            variant={transactionFilters.type === TransactionType.Income ? 'success' : 'outline'}
            className="h-8 gap-1.5"
            onClick={() => setType(TransactionType.Income)}
          >
            <ArrowDownCircle className="h-3.5 w-3.5" /> Income
          </Button>
          <Button
            aria-pressed={transactionFilters.type === TransactionType.Expense}
            size="sm"
            type="button"
            variant={transactionFilters.type === TransactionType.Expense ? 'destructive' : 'outline'}
            className="h-8 gap-1.5"
            onClick={() => setType(TransactionType.Expense)}
          >
            <ArrowUpCircle className="h-3.5 w-3.5" /> Expense
          </Button>
          <Button
            aria-pressed={transactionFilters.isDraft === true}
            size="sm"
            type="button"
            variant={transactionFilters.isDraft === true ? 'secondary' : 'outline'}
            className="h-8 gap-1.5"
            onClick={() => setDraftFilter(true)}
          >
            <FileText className="h-3.5 w-3.5" /> Drafts
          </Button>
          <Button
            aria-pressed={transactionFilters.isDraft === false}
            size="sm"
            type="button"
            variant={transactionFilters.isDraft === false ? 'secondary' : 'outline'}
            className="h-8 gap-1.5"
            onClick={() => setDraftFilter(false)}
          >
            <FileText className="h-3.5 w-3.5" /> Non-draft
          </Button>
        </div>

        {/* Amount range */}
        <div className="flex items-center gap-2">
          <Input
            aria-label="Minimum amount"
            inputMode="decimal"
            placeholder="Min amount"
            type="number"
            value={minLocal}
            className="bg-background flex-1 h-8"
            onChange={handleMinChange}
          />
          <span aria-hidden="true" className="text-muted-foreground text-xs shrink-0">
            –
          </span>
          <Input
            aria-label="Maximum amount"
            inputMode="decimal"
            placeholder="Max amount"
            type="number"
            value={maxLocal}
            className="bg-background flex-1 h-8"
            onChange={handleMaxChange}
          />
        </div>

        {/* Currency */}
        <MultiSelect
          options={CURRENCY_OPTIONS}
          placeholder="All currencies"
          value={selectedCurrencies}
          className="w-full bg-background border-input"
          onValueChange={(values) => setFilter('currencies' as any, values.length ? values : (undefined as any))}
        />
      </div>

      {/* ── Display ── */}
      <div>
        <SectionLabel>Display</SectionLabel>
        <div className="flex gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-pressed={isCompactTable}
                size="sm"
                type="button"
                variant={isCompactTable ? 'secondary' : 'outline'}
                className={cn('flex-1 h-8 gap-1.5', isCompactTable && 'border-primary/40')}
                onClick={() => setIsCompactTable(!isCompactTable)}
              >
                <Minimize2 aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="text-xs">Compact</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle compact rows</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-pressed={showEmptyDays}
                size="sm"
                type="button"
                variant={showEmptyDays ? 'secondary' : 'outline'}
                className={cn('flex-1 h-8 gap-1.5', showEmptyDays && 'border-primary/40')}
                onClick={() => setShowEmptyDays(!showEmptyDays)}
              >
                <AlignJustify aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="text-xs">Empty days</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show days with no activity</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export const ListFiltersSheet: React.FC<ListFiltersSheetProps> = ({ isOpen = false, setIsOpen, onReset, ...props }) => {
  const activeCount = props.transactionFilters.activeCount ?? 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-[360px]">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-base">Filters</SheetTitle>
          <SheetDescription className="sr-only">Ledger filter options.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-4">
            <ListFiltersContent onReset={onReset} {...props} />
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t shrink-0 flex gap-2">
          {activeCount > 0 && onReset ? (
            <Button size="sm" variant="outline" className="flex-1" onClick={onReset}>
              Reset ({activeCount})
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <SheetClose asChild>
            <Button size="sm" className="flex-1">
              Done
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ListFiltersSheet;
