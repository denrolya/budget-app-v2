import debounce from 'lodash/debounce';
import { CalendarArrowDown, CalendarArrowUp, CalendarIcon, ChevronDown, Layers, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
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
import { FILTER_PRESETS, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';
import { TransactionFilters } from '@/features/transactions/models/TransactionFilters';
import { Timeframe } from '@/types/global';

interface Props {
  data: TransactionFilters;
  onChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => void;
  sortDirection?: 'asc' | 'desc';
  onSortToggle?: () => void;
}

const H = 'h-9';
const TYPEAHEAD_W = 'w-[15rem]';
const AMOUNT_W = 'w-20';
const DATE_TEXT = 'max-w-44 truncate';

// Visually connects CategoryTypeahead to its nested-toggle button on the right.
const TYPEAHEAD_JOINED = cn(TYPEAHEAD_W, '[&>div:first-child]:rounded-r-none [&>div:first-child]:border-r-0');

const Divider: React.FC = () => <span aria-hidden="true" className="hidden md:block h-6 w-px bg-border mx-1" />;

const CURRENCY_CODES = Object.keys(CURRENCIES) as CURRENCY_CODE[];

const InlineFilters: React.FC<Props> = ({ data, onChange, sortDirection, onSortToggle }) => {
  // --- Local amount state (avoids caret jumps on debounce) ---
  const [minLocal, setMinLocal] = useState('');
  const [maxLocal, setMaxLocal] = useState('');
  const [searchLocal, setSearchLocal] = useState(data.searchTerm ?? '');

  const debouncedAmount = useRef(
    debounce((minStr: string, maxStr: string) => {
      const min = minStr === '' ? NaN : Number(minStr);
      const max = maxStr === '' ? NaN : Number(maxStr);
      if (!Number.isFinite(min) && !Number.isFinite(max)) {
        onChange('amountRange', [] as any);
        return;
      }
      onChange('amountRange', [min, max] as any);
    }, 350),
  ).current;

  const debouncedSearch = useRef(
    debounce((value: string) => {
      onChange('searchTerm', value as any);
    }, 250),
  ).current;

  useEffect(
    () => () => {
      debouncedAmount.cancel();
      debouncedSearch.cancel();
    },
    [debouncedAmount, debouncedSearch],
  );

  // Sync external amount → local (reset / URL navigation)
  useEffect(() => {
    const [extMin, extMax] = data.amountRange ?? [];
    setMinLocal((p) => {
      const n = extMin != null && Number.isFinite(extMin) ? String(extMin) : '';
      return p === n ? p : n;
    });
    setMaxLocal((p) => {
      const n = extMax != null && Number.isFinite(extMax) ? String(extMax) : '';
      return p === n ? p : n;
    });
  }, [data.amountRange]);

  useEffect(() => {
    setSearchLocal(data.searchTerm ?? '');
  }, [data.searchTerm]);

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

  const dateLabel = useMemo(() => {
    if (data.after && data.before)
      return `${data.after.format(MOMENT_DATEPICKER_FORMAT)} – ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`;
    if (!data.after && data.before) return `Before ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`;
    if (data.after && !data.before) return `After ${data.after.format(MOMENT_DATEPICKER_FORMAT)}`;
    return 'Date';
  }, [data.after, data.before]);

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      onChange('after', range.after ?? undefined);
      onChange('before', range.before ?? undefined);
    },
    [onChange],
  );

  const toggleNestedCategories = useCallback(() => {
    onChange('withNestedCategories', !data.withNestedCategories);
  }, [data.withNestedCategories, onChange]);

  const selectedCurrencies: string[] = useMemo(() => (data as any).currencies ?? [], [data]);

  const toggleCurrency = useCallback(
    (code: CURRENCY_CODE) => {
      const next = selectedCurrencies.includes(code)
        ? selectedCurrencies.filter((c) => c !== code)
        : [...selectedCurrencies, code];
      onChange('currencies' as any, (next.length ? next : undefined) as any);
    },
    [selectedCurrencies, onChange],
  );

  const clearCurrencies = useCallback(() => {
    onChange('currencies' as any, undefined as any);
  }, [onChange]);

  const currencyLabel = useMemo(() => {
    if (selectedCurrencies.length === 0) return 'Currency';
    if (selectedCurrencies.length <= 2)
      return selectedCurrencies.map((c) => CURRENCIES[c as CURRENCY_CODE]?.symbol ?? c).join(' ');
    return `${selectedCurrencies.length} currencies`;
  }, [selectedCurrencies]);

  return (
    <div className="border-b bg-muted/30 supports-[backdrop-filter]:bg-muted/30">
      <div
        aria-label="Transaction filters"
        role="toolbar"
        className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2"
      >
        {/* DATE + SORT ORDER */}
        <div className="flex items-stretch">
          <DaterangePickerWithPresets
            after={data.after}
            before={data.before}
            presets={FILTER_PRESETS}
            onChange={handleTimeframeChange}
          >
            <Button
              size="sm"
              type="button"
              variant="outline"
              className={cn(H, 'bg-background px-2', onSortToggle && 'rounded-r-none border-r-0')}
            >
              <CalendarIcon aria-hidden="true" className="mr-1.5 h-4 w-4 shrink-0" />
              <span className={DATE_TEXT}>{dateLabel}</span>
            </Button>
          </DaterangePickerWithPresets>

          {onSortToggle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Toggle sort order"
                  aria-pressed={sortDirection === 'asc'}
                  size="icon"
                  type="button"
                  variant="outline"
                  className="h-9 w-9 rounded-l-none border border-input shrink-0"
                  onClick={onSortToggle}
                >
                  {sortDirection === 'asc' ? (
                    <CalendarArrowUp aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <CalendarArrowDown aria-hidden="true" className="h-4 w-4" />
                  )}
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
            value={data.accounts}
            className="w-full"
            onChange={(accounts) => onChange('accounts', accounts as string[] | null)}
          />
        </div>

        <Divider />

        {/* CATEGORIES + NESTED BTN-GROUP */}
        <div aria-label="Categories filter" role="group" className="flex items-stretch">
          <CategoryTypeahead
            multiple
            placeholder="Categories"
            value={data.categories as string[]}
            className={TYPEAHEAD_JOINED}
            onChange={(categories) => {
              onChange('categories', categories as string[] | null);
              if (categories?.length) onChange('withNestedCategories', true);
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Include nested categories"
                aria-pressed={data.withNestedCategories}
                size="icon"
                type="button"
                variant={data.withNestedCategories ? 'secondary' : 'outline'}
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

        {/* CURRENCY DROPDOWN */}
        <div aria-label="Currency filter" role="group" className="flex items-stretch">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={selectedCurrencies.length > 0 ? 'secondary' : 'outline'}
                className={cn(
                  H,
                  'bg-background px-2 gap-1',
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
              className="h-9 w-7 rounded-l-none border border-l-0 border-input shrink-0"
              onClick={clearCurrencies}
            >
              <X aria-hidden="true" className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InlineFilters;
