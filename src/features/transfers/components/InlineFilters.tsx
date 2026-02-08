import debounce from 'lodash/debounce';
import { CalendarIcon, RotateCcw } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';
import TransferFilters from '@/features/transfers/models/TransferFilters';
import { Timeframe } from '@/types/global';

interface Props {
  data: TransferFilters;
  onChange: <K extends keyof TransferFilters>(key: K, value: TransferFilters[K] | undefined | null) => void;
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

const DATE_PRESETS = [
  { label: 'This Month', range: { after: moment().startOf('month'), before: moment().endOf('month') } },
  { label: 'Last 30 Days', range: { after: moment().subtract(30, 'days'), before: moment() } },
  { label: 'This Year', range: { after: moment().startOf('year'), before: moment().endOf('year') } },
  {
    label: 'Last Year',
    range: {
      after: moment().subtract(1, 'year').startOf('year'),
      before: moment().subtract(1, 'year').endOf('year'),
    },
  },
];

const InlineFiltersTransfers: React.FC<Props> = ({ data, onChange, onReset, isLoading, onFiltersDialogToggle }) => {
  const [localAmountRange, setLocalAmountRange] = useState(data.amountRange);

  const debouncedOnChange = useRef(
    debounce(<K extends keyof TransferFilters>(key: K, value: TransferFilters[K] | undefined | null) => {
      onChange(key, value);
    }, 250),
  ).current;

  useEffect(() => () => debouncedOnChange.cancel(), [debouncedOnChange]);

  useEffect(() => {
    setLocalAmountRange(data.amountRange);
  }, [data.amountRange]);

  const dateLabel = useMemo(() => {
    const { after, before } = data;
    if (after && before) return `${after.format(MOMENT_DATEPICKER_FORMAT)} - ${before.format(MOMENT_DATEPICKER_FORMAT)}`;
    if (!after && before) return `Before ${before.format(MOMENT_DATEPICKER_FORMAT)}`;
    if (after && !before) return `After ${after.format(MOMENT_DATEPICKER_FORMAT)}`;
    return 'Date';
  }, [data.after, data.before]);

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      onChange('after', range.after ?? undefined);
      onChange('before', range.before ?? undefined);
    },
    [onChange],
  );

  const handleMinAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextMin = e.target.value === '' ? undefined : Number.parseInt(e.target.value, 10);
      setLocalAmountRange((prev) => [nextMin, prev[1]]);
      debouncedOnChange('amountRange', [nextMin, localAmountRange[1]]);
    },
    [debouncedOnChange, localAmountRange],
  );

  const handleMaxAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextMax = e.target.value === '' ? undefined : Number.parseInt(e.target.value, 10);
      setLocalAmountRange((prev) => [prev[0], nextMax]);
      debouncedOnChange('amountRange', [localAmountRange[0], nextMax]);
    },
    [debouncedOnChange, localAmountRange],
  );

  const canReset = data.activeCount > 0 && !isLoading;

  return (
    <div className="border-b bg-muted/30 supports-[backdrop-filter]:bg-muted/30">
      <div
        aria-label="Transfer filters"
        role="toolbar"
        className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2"
      >
        {/* DATE */}
        <div className="flex items-center gap-1.5">
          <div aria-label="Date range" role="group" className="flex items-center">
            <DaterangePickerWithPresets
              after={data.after || moment().startOf('month')}
              before={data.before || moment().endOf('month')}
              presets={DATE_PRESETS}
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

        {/* ACCOUNTS */}
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
        </div>

        <Divider />

        {/* AMOUNT */}
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
        </div>

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

export default InlineFiltersTransfers;
