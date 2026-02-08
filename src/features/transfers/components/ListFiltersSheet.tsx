import debounce from 'lodash/debounce';
import { CalendarIcon, FilterIcon } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { TransactionFilters } from '@/features/transactions/models/TransactionFilters';
import TransferFilters from '@/features/transfers/models/TransferFilters';
import { Timeframe } from '@/types/global';

interface ListFiltersProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  data: TransferFilters;
  className?: string;
  onChange: <K extends keyof TransferFilters>(key: K, value: TransferFilters[K] | undefined | null) => void;
  onReset: () => void;
}

const datePresets = [
  { label: 'This Month', range: { after: moment().startOf('month'), before: moment().endOf('month') } },
  { label: 'Last 30 Days', range: { after: moment().subtract(30, 'days'), before: moment() } },
  { label: 'This Year', range: { after: moment().startOf('year'), before: moment().endOf('year') } },
  {
    label: 'Last Year',
    range: { after: moment().subtract(1, 'year').startOf('year'), before: moment().subtract(1, 'year').endOf('year') },
  },
];

const Content: React.FC<ListFiltersProps> = ({ data, onChange, onReset }) => {
  const [localAmountRange, setLocalAmountRange] = useState(data.amountRange);

  const debouncedOnChange = useRef(
    debounce(<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => {
      onChange(key, value);
    }, 300),
  ).current;

  useEffect(
    () => () => {
      debouncedOnChange.cancel();
    },
    [debouncedOnChange],
  );

  useEffect(() => {
    setLocalAmountRange(data.amountRange);
  }, [data.amountRange]);

  const handleMinAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = e.target.value === '' ? undefined : parseInt(e.target.value);
      setLocalAmountRange((prev) => [newMin, prev[1]]);
      debouncedOnChange('amountRange', [newMin, localAmountRange[1]]);
    },
    [localAmountRange, debouncedOnChange],
  );

  const handleMaxAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = e.target.value === '' ? undefined : parseInt(e.target.value);
      setLocalAmountRange((prev) => [prev[0], newMax]);
      debouncedOnChange('amountRange', [localAmountRange[0], newMax]);
    },
    [localAmountRange, debouncedOnChange],
  );

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      onChange('after', range.after ? range.after : undefined);
      onChange('before', range.before ? range.before : undefined);
    },
    [onChange],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date-range">Date Range</Label>
        <DaterangePickerWithPresets
          after={data.after || moment().startOf('month')}
          before={data.before || moment().endOf('month')}
          id="date-range"
          presets={datePresets}
          onChange={handleTimeframeChange}
        >
          <Button id="date-range" size="sm" variant="outline" className="h-9 text-sm w-full justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>
              {data.after &&
                data.before &&
                `${data.after.format(MOMENT_DATEPICKER_FORMAT)} - ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`}
              {!data.after && data.before && `Before ${data.before.format(MOMENT_DATEPICKER_FORMAT)}`}
              {data.after && !data.before && `After ${data.after.format(MOMENT_DATEPICKER_FORMAT)}`}
              {!data.after && !data.before && 'Select date range'}
            </span>
          </Button>
        </DaterangePickerWithPresets>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accounts">Accounts</Label>
        <AccountTypeahead
          multiple
          id="accounts"
          value={data.accounts}
          className="h-9 w-full"
          onChange={(accounts) => onChange('accounts', accounts)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount-range" className="flex items-center text-sm font-medium">
          <FilterIcon className="mr-2 h-4 w-4" />
          Amount Range
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            id="min-amount"
            placeholder="Min"
            type="number"
            value={localAmountRange[0] === undefined ? '' : localAmountRange[0]}
            className="w-full"
            onChange={handleMinAmountChange}
          />
          <span className="text-sm">to</span>
          <Input
            id="max-amount"
            placeholder="Max"
            type="number"
            value={localAmountRange[1] === undefined ? '' : localAmountRange[1]}
            className="w-full"
            onChange={handleMaxAmountChange}
          />
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={onReset}>
        Reset Filters
      </Button>
    </div>
  );
};

export const ListFiltersSheet: React.FC<ListFiltersProps> = ({
  isOpen = false,
  setIsOpen,
  data,
  onChange,
  onReset,
}) => {
  const isMobile = useIsMobile();

  const handleChange = useCallback(
    <K extends keyof TransferFilters>(key: K, value: TransferFilters[K]) => {
      onChange(key, value);
    },
    [onChange],
  );

  const FilterWrapper = !isMobile ? Sheet : Drawer;
  const FilterHeader = !isMobile ? SheetHeader : DrawerHeader;
  const FilterTitle = !isMobile ? SheetTitle : DrawerTitle;
  const FilterDescription = !isMobile ? SheetDescription : DrawerDescription;
  const FilterContent = !isMobile ? SheetContent : DrawerContent;

  return (
    <FilterWrapper open={isOpen} onOpenChange={setIsOpen}>
      <FilterContent
        side={!isMobile ? 'right' : undefined}
        className={!isMobile ? 'w-[400px] sm:w-[540px]' : undefined}
      >
        <FilterHeader>
          <FilterTitle>Transaction Filters</FilterTitle>
          <FilterDescription className="sr-only">
            Filter transfers by date, accounts, and amount range.
          </FilterDescription>
        </FilterHeader>
        <div className={!isMobile ? 'mt-4' : 'px-4 pb-4'}>
          <Content data={data} onChange={handleChange} onReset={onReset} />
        </div>
      </FilterContent>
    </FilterWrapper>
  );
};

export default ListFiltersSheet;
