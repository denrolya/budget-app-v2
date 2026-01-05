import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import debounce from 'lodash/debounce';
import { ArrowDownCircle, ArrowUpCircle, CalendarIcon, FileText, Layers, RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FILTER_PRESETS, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';
import { TransactionFilters } from '@/models/TransactionFilters';
import { Timeframe } from '@/types/global';
import { Type as TransactionType } from '@/types/transaction';

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
        role="toolbar"
        aria-label="Transaction filters"
        className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2"
      >
        {/* DATE */}
        <div className="flex items-center gap-1.5">
          <div role="group" aria-label="Date range" className="flex items-center">
            <DaterangePickerWithPresets
              after={data.after}
              before={data.before}
              onChange={handleTimeframeChange}
              presets={FILTER_PRESETS}
            >
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
        </div>

        <Divider />

        {/* MAIN SELECTORS */}
        <div className="flex items-center gap-1.5">
          <div className={cn('flex items-center', TYPEAHEAD_W)} role="group" aria-label="Accounts filter">
            <AccountTypeahead
              multiple
              value={data.accounts}
              onChange={(accounts) => onChange('accounts', accounts)}
              placeholder="Accounts"
              className="w-full"
              aria-label="Filter by accounts"
            />
          </div>

          <Divider />

          <div className={cn('flex items-center', TYPEAHEAD_W)} role="group" aria-label="Categories filter">
            <CategoryTypeahead
              multiple
              value={data.categories}
              onChange={(categories) => onChange('categories', categories)}
              placeholder="Categories"
              className="w-full"
              aria-label="Filter by categories"
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={data.withNestedCategories ? 'secondary' : 'outline'}
                size="icon"
                className={ICON_BTN}
                onClick={toggleNestedCategories}
                aria-label="Nested categories"
                aria-pressed={data.withNestedCategories}
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
              value={localAmountRange[0] ?? ''}
              onChange={handleMinAmountChange}
              className={cn(H, AMOUNT_W, 'bg-background')}
              placeholder="Min"
              inputMode="numeric"
              aria-label="Minimum amount"
            />
            <Input
              type="number"
              value={localAmountRange[1] ?? ''}
              onChange={handleMaxAmountChange}
              className={cn(H, AMOUNT_W, 'bg-background')}
              placeholder="Max"
              inputMode="numeric"
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
                <ArrowDownCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
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
                <ArrowUpCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Expense
              </Button>
            </div>
          </div>

          <Divider />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={data.isDraft ? 'secondary' : 'outline'}
                size="icon"
                className={ICON_BTN}
                onClick={toggleDraft}
                aria-label="Only drafts"
                aria-pressed={data.isDraft}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
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
                type="button"
                variant="outline"
                size="icon"
                className={ICON_BTN}
                onClick={onReset}
                disabled={!canReset}
                aria-label="Reset filters"
              >
                <RotateCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} aria-hidden="true" />
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
