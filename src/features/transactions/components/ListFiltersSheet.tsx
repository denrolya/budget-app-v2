import debounce from 'lodash/debounce';
import { ArrowDownCircle, ArrowUpCircle, ChevronDown, FileText, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import CategoryTypeahead from '@/features/categories/components/CategoryTypeahead';
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
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionFilters } from '@/features/transactions/models/TransactionFilters';
import { Type as TransactionType } from '@/features/transactions';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  isOpen?: boolean;
  setIsOpen: (open: boolean) => void;
  data: TransactionFilters;
  onChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => void;
  onReset: () => void;
}

const CURRENCY_CODES = Object.keys(CURRENCIES) as CURRENCY_CODE[];
const LABEL_CLS = 'text-xs font-medium text-muted-foreground uppercase tracking-wider';

const Content: React.FC<Props> = ({ data, onChange, onReset }) => {
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

  useEffect(() => () => { debouncedAmount.cancel(); debouncedSearch.cancel(); }, [debouncedAmount, debouncedSearch]);

  useEffect(() => {
    const [extMin, extMax] = data.amountRange ?? [];
    setMinLocal((p) => { const n = (extMin != null && Number.isFinite(extMin)) ? String(extMin) : ''; return p === n ? p : n; });
    setMaxLocal((p) => { const n = (extMax != null && Number.isFinite(extMax)) ? String(extMax) : ''; return p === n ? p : n; });
  }, [data.amountRange]);

  useEffect(() => { setSearchLocal(data.searchTerm ?? ''); }, [data.searchTerm]);

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

  const selectedCurrencies: string[] = useMemo(() => (data as any).currencies ?? [], [data]);

  const toggleCurrency = useCallback((code: CURRENCY_CODE) => {
    const next = selectedCurrencies.includes(code)
      ? selectedCurrencies.filter((c) => c !== code)
      : [...selectedCurrencies, code];
    onChange('currencies' as any, (next.length ? next : undefined) as any);
  }, [selectedCurrencies, onChange]);

  const clearCurrencies = useCallback(() => {
    onChange('currencies' as any, undefined as any);
  }, [onChange]);

  const currencyLabel = useMemo(() => {
    if (selectedCurrencies.length === 0) return 'Currency';
    if (selectedCurrencies.length <= 2) return selectedCurrencies.map((c) => CURRENCIES[c as CURRENCY_CODE]?.symbol ?? c).join(' ');
    return `${selectedCurrencies.length} currencies`;
  }, [selectedCurrencies]);

  const setType = useCallback((type: TransactionType) => {
    onChange('type', data.type === type ? undefined : type);
  }, [data.type, onChange]);

  const toggleDraft = useCallback(() => {
    onChange('isDraft', data.isDraft === undefined ? true : !data.isDraft || undefined);
  }, [data.isDraft, onChange]);

  const toggleNestedCategories = useCallback(() => {
    onChange('withNestedCategories', !data.withNestedCategories);
  }, [data.withNestedCategories, onChange]);

  return (
    <div className="space-y-5 px-1">

      {/* ACCOUNTS */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Accounts</Label>
        <AccountTypeahead
          multiple
          placeholder="All accounts"
          value={data.accounts}
          className="w-full"
          onChange={(accounts) => onChange('accounts', accounts as string[] | null)}
        />
      </div>

      {/* CATEGORIES + NESTED */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Categories</Label>
        <div className="flex items-stretch">
          <CategoryTypeahead
            multiple
            placeholder="All categories"
            value={data.categories as string[]}
            className="flex-1 [&>div:first-child]:rounded-r-none [&>div:first-child]:border-r-0"
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
          <span aria-hidden="true" className="text-muted-foreground text-xs shrink-0">–</span>
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
          <Search aria-hidden="true" className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
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
                className={cn('flex-1 justify-between bg-background px-3 gap-1 h-9',
                  selectedCurrencies.length > 0 && 'rounded-r-none border-r-0')}
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
            aria-pressed={data.type === TransactionType.Income}
            size="sm"
            type="button"
            variant={data.type === TransactionType.Income ? 'success' : 'outline'}
            className="flex-1"
            onClick={() => setType(TransactionType.Income)}
          >
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Income
          </Button>
          <Button
            aria-pressed={data.type === TransactionType.Expense}
            size="sm"
            type="button"
            variant={data.type === TransactionType.Expense ? 'destructive' : 'outline'}
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
          aria-pressed={data.isDraft === true}
          size="sm"
          type="button"
          variant={data.isDraft === true ? 'secondary' : 'outline'}
          className="w-full justify-start"
          onClick={toggleDraft}
        >
          <FileText className="mr-2 h-4 w-4" />
          {data.isDraft === true ? 'Showing drafts only' : 'Show drafts only'}
        </Button>
      </div>

      {/* RESET */}
      {data.activeCount > 0 && (
        <Button size="sm" variant="outline" className="w-full" onClick={onReset}>
          Reset all filters
        </Button>
      )}
    </div>
  );
};

export const ListFiltersSheet: React.FC<Props> = ({ isOpen = false, setIsOpen, data, onChange, onReset }) => {
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
          <FilterDescription className="sr-only">Additional transaction filter options.</FilterDescription>
        </FilterHeader>
        <div className="overflow-y-auto px-4 pb-6 pt-2">
          <Content data={data} onChange={onChange} onReset={onReset} setIsOpen={setIsOpen} isOpen={isOpen} />

        </div>
      </FilterContent>
    </FilterWrapper>
  );
};

export default ListFiltersSheet;
