import debounce from 'lodash/debounce';
import { ArrowDownCircle, ArrowUpCircle, CalendarIcon, FileText, Layers, RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import CategoryTypeahead from '@/features/categories/components/CategoryTypeahead';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FILTER_PRESETS, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';
import { TransactionFilters } from '@/features/transactions/models/TransactionFilters';
import { Timeframe } from '@/types/global';
import { Type as TransactionType } from '@/features/transactions';

interface Props {
  data: TransactionFilters;
  onChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => void;
  onReset: () => void;
  isLoading?: boolean;
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

const InlineFilters: React.FC<Props> = ({ data, onChange, onReset, isLoading, onFiltersDialogToggle }) => {
  const [localAmountRange, setLocalAmountRange] = useState(data.amountRange);

  const debouncedOnChange = useRef(
    debounce(<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => {
      onChange(key, value);
    }, 250),
  ).current;

  useEffect(() => () => debouncedOnChange.cancel(), [debouncedOnChange]);

  useEffect(() => {
    setLocalAmountRange(data.amountRange);
  }, [data.amountRange]);

  const dateLabel = useMemo(() => {
    const { after, before } = data;
    if (after && before)
      return `${after.format(MOMENT_DATEPICKER_FORMAT)} - ${before.format(MOMENT_DATEPICKER_FORMAT)}`;
    if (!after && before) return `Before ${before.format(MOMENT_DATEPICKER_FORMAT)}`;
    if (after && !before) return `After ${after.format(MOMENT_DATEPICKER_FORMAT)}`;
    return 'Date';
  }, [data.after, data.before]);

  const isIncome = data.type === TransactionType.Income;
  const isExpense = data.type === TransactionType.Expense;

  const setType = useCallback(
    (type: TransactionType) => {
      onChange('type', data.type === type ? undefined : type);
    },
    [data.type, onChange],
  );

  const toggleDraft = useCallback(() => {
    debouncedOnChange('isDraft', !data.isDraft);
  }, [data.isDraft, debouncedOnChange]);

  const toggleNestedCategories = useCallback(() => {
    debouncedOnChange('withNestedCategories', !data.withNestedCategories);
  }, [data.withNestedCategories, debouncedOnChange]);

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      onChange('after', range.after ?? undefined);
      onChange('before', range.before ?? undefined);
    },
    [onChange],
  );

  const handleMinAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
      setLocalAmountRange((prev) => [newMin, prev[1]]);
      debouncedOnChange('amountRange', [newMin, localAmountRange[1]]);
    },
    [debouncedOnChange, localAmountRange],
  );

  const handleMaxAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
      setLocalAmountRange((prev) => [prev[0], newMax]);
      debouncedOnChange('amountRange', [localAmountRange[0], newMax]);
    },
    [debouncedOnChange, localAmountRange],
  );

  const canReset = data.activeCount > 0 && !isLoading;

  return (
    <div className="border-b bg-muted/30 supports-[backdrop-filter]:bg-muted/30">
      <div
        aria-label="Transaction filters"
        role="toolbar"
        className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2"
      >
        {/* DATE */}
        <div className="flex items-center gap-1.5">
          <div aria-label="Date range" role="group" className="flex items-center">
            <DaterangePickerWithPresets
              after={data.after}
              before={data.before}
              presets={FILTER_PRESETS}
              onChange={handleTimeframeChange}
            >
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
        </div>

        <Divider />

        {/* MAIN SELECTORS */}
        <div className="flex items-center gap-1.5">
          <div aria-label="Accounts filter" role="group" className={cn('flex items-center', TYPEAHEAD_W)}>
            <AccountTypeahead
              multiple
              aria-label="Filter by accounts"
              placeholder="Accounts"
              value={data.accounts}
              className="w-full"
              onChange={(accounts) => onChange('accounts', accounts)}
            />
          </div>

          <Divider />

          <div aria-label="Categories filter" role="group" className={cn('flex items-center', TYPEAHEAD_W)}>
            <CategoryTypeahead
              multiple
              aria-label="Filter by categories"
              placeholder="Categories"
              value={data.categories}
              className="w-full"
              onChange={(categories) => onChange('categories', categories)}
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Nested categories"
                aria-pressed={data.withNestedCategories}
                size="icon"
                type="button"
                variant={data.withNestedCategories ? 'secondary' : 'outline'}
                className={ICON_BTN}
                onClick={toggleNestedCategories}
              >
                <Layers aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Nested categories</TooltipContent>
          </Tooltip>
        </div>

        <Divider />

        {/* AMOUNT + TYPE + DRAFT */}
        <div className="flex items-center gap-1.5">
          <div aria-label="Amount range" role="group" className="flex items-center gap-1.5">
            <Input
              aria-label="Minimum amount"
              inputMode="numeric"
              placeholder="Min"
              type="number"
              value={localAmountRange[0] ?? ''}
              className={cn(H, AMOUNT_W, 'bg-background')}
              onChange={handleMinAmountChange}
            />
            <Input
              aria-label="Maximum amount"
              inputMode="numeric"
              placeholder="Max"
              type="number"
              value={localAmountRange[1] ?? ''}
              className={cn(H, AMOUNT_W, 'bg-background')}
              onChange={handleMaxAmountChange}
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
                <ArrowDownCircle aria-hidden="true" className="mr-1.5 h-4 w-4" />
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
                <ArrowUpCircle aria-hidden="true" className="mr-1.5 h-4 w-4" />
                Expense
              </Button>
            </div>
          </div>

          <Divider />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Only drafts"
                aria-pressed={data.isDraft}
                size="icon"
                type="button"
                variant={data.isDraft ? 'secondary' : 'outline'}
                className={ICON_BTN}
                onClick={toggleDraft}
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Only drafts</TooltipContent>
          </Tooltip>
        </div>

        {/* RESET */}
        <div className="ml-0 md:ml-auto flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Reset filters"
                disabled={!canReset}
                size="icon"
                type="button"
                variant="outline"
                className={ICON_BTN}
                onClick={onReset}
              >
                <RotateCcw aria-hidden="true" className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset filters</TooltipContent>
          </Tooltip>

          <FiltersToggleButton activeCount={data.activeCount} onClick={onFiltersDialogToggle} />
        </div>
      </div>
    </div>
  );
};

export default InlineFilters;
