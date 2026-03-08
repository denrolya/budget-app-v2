import debounce from 'lodash/debounce';
import { ArrowDownCircle, ArrowUpCircle, CalendarIcon, ChevronDown, FileText, Layers, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { cn } from '@/lib/utils';
import { TransactionFilters } from '@/features/transactions';
import { Type as TransactionType } from '@/features/transactions';
import { TransferFilters } from '@/features/transfers';
import { useIsMobile } from '@/hooks/use-mobile';
import { Timeframe } from '@/types/global';

interface ListFiltersContentProps {
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;

  setFilter: (key: string, value: any) => void;
  showTransactions: boolean;
  setShowTransactions: (value: boolean) => void;
  showTransfers: boolean;
  setShowTransfers: (value: boolean) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  onReset?: () => void;
}

interface ListFiltersProps extends ListFiltersContentProps {
  isOpen?: boolean;
  setIsOpen: (value: boolean) => void;
}

const CURRENCY_CODES = Object.keys(CURRENCIES) as CURRENCY_CODE[];

const LABEL_CLS = 'text-xs font-medium text-muted-foreground uppercase tracking-wider';

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
  onReset,
}) => {
  // --- Local amount + search state (avoids caret jumps on debounce) ---
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

  const debouncedSearch = useRef(
    debounce((value: string) => {
      setFilter('searchTerm', value as any);
    }, 250),
  ).current;

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

  const toggleCurrency = useCallback(
    (code: CURRENCY_CODE) => {
      const next = selectedCurrencies.includes(code)
        ? selectedCurrencies.filter((c: string) => c !== code)
        : [...selectedCurrencies, code];
      setFilter('currencies' as any, (next.length ? next : undefined) as any);
    },
    [selectedCurrencies, setFilter],
  );

  const clearCurrencies = useCallback(() => {
    setFilter('currencies' as any, undefined as any);
  }, [setFilter]);

  const currencyLabel = useMemo(() => {
    if (selectedCurrencies.length === 0) return 'Currency';
    if (selectedCurrencies.length <= 2)
      return selectedCurrencies.map((c) => CURRENCIES[c as CURRENCY_CODE]?.symbol ?? c).join(' ');
    return `${selectedCurrencies.length} currencies`;
  }, [selectedCurrencies]);

  const setType = useCallback(
    (type: TransactionType) => {
      setFilter('type', transactionFilters.type === type ? undefined : type);
    },
    [setFilter, transactionFilters.type],
  );

  const toggleDraft = useCallback(() => {
    setFilter('isDraft', transactionFilters.isDraft === undefined ? true : !transactionFilters.isDraft || undefined);
  }, [setFilter, transactionFilters.isDraft]);

  const toggleNestedCategories = useCallback(() => {
    setFilter('withNestedCategories', !transactionFilters.withNestedCategories);
  }, [setFilter, transactionFilters.withNestedCategories]);

  const activeCount = transactionFilters.activeCount ?? 0;

  return (
    <div className="space-y-5 px-1">
      {/* DATE RANGE */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Date range</Label>
        <DaterangePickerWithPresets after={timeframe.after} before={timeframe.before} onChange={handleTimeframeChange}>
          <Button size="sm" type="button" variant="outline" className="w-full justify-start bg-background h-9 px-2">
            <CalendarIcon aria-hidden="true" className="mr-1.5 h-4 w-4 shrink-0" />
            <span className="truncate text-xs">{dateLabel}</span>
          </Button>
        </DaterangePickerWithPresets>
      </div>

      {/* SHOW TRANSACTIONS / TRANSFERS */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Show</Label>
        <div className="flex gap-2">
          <Button
            aria-pressed={showTransactions}
            size="sm"
            type="button"
            variant={showTransactions ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setShowTransactions(!showTransactions)}
          >
            Transactions
          </Button>
          <Button
            aria-pressed={showTransfers}
            size="sm"
            type="button"
            variant={showTransfers ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setShowTransfers(!showTransfers)}
          >
            Transfers
          </Button>
        </div>
      </div>

      {/* ACCOUNTS */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Accounts</Label>
        <AccountTypeahead
          multiple
          placeholder="All accounts"
          value={accountsValue}
          className="w-full"
          onChange={(accounts) => setFilter('accounts' as any, accounts as any)}
        />
      </div>

      {/* CATEGORIES + NESTED */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Categories</Label>
        <div className="flex items-stretch">
          <CategoryTypeahead
            multiple
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
      </div>

      {/* AMOUNT RANGE */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Amount range</Label>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Minimum amount"
            inputMode="decimal"
            placeholder="Min"
            type="number"
            value={minLocal}
            className="bg-background flex-1 h-9"
            onChange={handleMinChange}
          />
          <span aria-hidden="true" className="text-muted-foreground text-xs shrink-0">
            –
          </span>
          <Input
            aria-label="Maximum amount"
            inputMode="decimal"
            placeholder="Max"
            type="number"
            value={maxLocal}
            className="bg-background flex-1 h-9"
            onChange={handleMaxChange}
          />
        </div>
      </div>

      {/* NOTE SEARCH */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Search</Label>
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
            className="bg-background pl-8 w-full h-9"
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* CURRENCY */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Currency</Label>
        <div className="flex items-stretch">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={selectedCurrencies.length > 0 ? 'secondary' : 'outline'}
                className={cn(
                  'flex-1 justify-between bg-background px-3 gap-1 h-9',
                  selectedCurrencies.length > 0 && 'rounded-r-none border-r-0',
                )}
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
              className="h-9 w-9 rounded-l-none border border-l-0 border-input shrink-0"
              onClick={clearCurrencies}
            >
              <X aria-hidden="true" className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* TRANSACTION TYPE */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Type</Label>
        <div className="flex gap-2">
          <Button
            aria-pressed={transactionFilters.type === TransactionType.Income}
            size="sm"
            type="button"
            variant={transactionFilters.type === TransactionType.Income ? 'success' : 'outline'}
            className="flex-1"
            onClick={() => setType(TransactionType.Income)}
          >
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Income
          </Button>
          <Button
            aria-pressed={transactionFilters.type === TransactionType.Expense}
            size="sm"
            type="button"
            variant={transactionFilters.type === TransactionType.Expense ? 'destructive' : 'outline'}
            className="flex-1"
            onClick={() => setType(TransactionType.Expense)}
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Expense
          </Button>
        </div>
      </div>

      {/* STATUS */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Status</Label>
        <Button
          aria-pressed={transactionFilters.isDraft === true}
          size="sm"
          type="button"
          variant={transactionFilters.isDraft === true ? 'secondary' : 'outline'}
          className="w-full justify-start"
          onClick={toggleDraft}
        >
          <FileText className="mr-2 h-4 w-4" />
          {transactionFilters.isDraft === true ? 'Showing drafts only' : 'Show drafts only'}
        </Button>
      </div>

      {/* RESET */}
      {activeCount > 0 && onReset && (
        <Button size="sm" variant="outline" className="w-full" onClick={onReset}>
          Reset all filters
        </Button>
      )}
    </div>
  );
};

export const ListFiltersSheet: React.FC<ListFiltersProps> = ({ isOpen = false, setIsOpen, ...props }) => {
  const isMobile = useIsMobile();

  const FilterWrapper = isMobile ? Drawer : Sheet;
  const FilterContent = isMobile ? DrawerContent : SheetContent;
  const FilterHeader = isMobile ? DrawerHeader : SheetHeader;
  const FilterTitle = isMobile ? DrawerTitle : SheetTitle;
  const FilterDescription = isMobile ? DrawerDescription : SheetDescription;

  return (
    <FilterWrapper open={isOpen} onOpenChange={setIsOpen}>
      <FilterContent side={isMobile ? undefined : 'right'} className={isMobile ? undefined : 'w-96'}>
        <FilterHeader>
          <FilterTitle>Filters</FilterTitle>
          <FilterDescription className="sr-only">Ledger filter options.</FilterDescription>
        </FilterHeader>
        <div className="overflow-y-auto px-4 pb-6 pt-2">
          <ListFiltersContent {...props} />
        </div>
      </FilterContent>
    </FilterWrapper>
  );
};

export default ListFiltersSheet;
