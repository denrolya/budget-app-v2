import { CalendarArrowDown, CalendarArrowUp, RotateCcw } from 'lucide-react';
import { Moment } from 'moment';
import React, { useCallback } from 'react';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TransactionFilters } from '@/models/TransactionFilters';
import { TransferFilters } from '@/models/TransferFilters';
import { Timeframe } from '@/types/global';

type CombinedFilters = TransactionFilters & TransferFilters;

interface ListingControlsProps {
  isLoading?: boolean;
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  setFilter: (type: keyof CombinedFilters, value: any) => void;
  setShowTransactions: (value: boolean) => void;
  setShowTransfers: (value: boolean) => void;
  timeframe: { after: Moment; before: Moment };
  setTimeframe: (range: { after: Moment; before: Moment } | null) => void;
  activeView: 'table' | 'list';
  isReversedOrder: boolean;
  setIsReversedOrder: (value: boolean) => void;
  handleResetFilters: () => void;
  onFiltersDialogToggle: () => void;
}

export const ListingControls: React.FC<ListingControlsProps> = ({
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
}) => {
  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: range.after ? range.after.startOf('day') : timeframe.after,
        before: range.before ? range.before.endOf('day') : timeframe.before,
      });
    },
    [setTimeframe],
  );

  const handleAmountRangeChange = useCallback(
    (value: [number | undefined, number | undefined]) => {
      setFilter('amountRange', value);
    },
    [setFilter],
  );

  const handleCategoryChange = useCallback(
    (categories: any[]) => {
      setFilter('categories', categories);
      if (categories.length > 0) {
        setShowTransactions(true);
        setShowTransfers(false);
      }
    },
    [setFilter, setShowTransactions, setShowTransfers],
  );

  return (
    <div className="flex flex-row items-center justify-between flex-wrap gap-2 relative">
      <DaterangePickerWithPresets after={timeframe.after} before={timeframe.before} onChange={handleTimeframeChange} />
      {activeView === 'table' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="hidden md:flex"
              onClick={() => setIsReversedOrder(!isReversedOrder)}
            >
              {isReversedOrder && <CalendarArrowUp className="h-4 w-4" />}
              {!isReversedOrder && <CalendarArrowDown className="h-4 w-4" />}
              <span className="sr-only">Toggle ordering</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle ordering</TooltipContent>
        </Tooltip>
      )}

      <Separator orientation="vertical" className="h-8" />

      <div className="flex-grow w-[26rem]">
        <AccountTypeahead
          multiple
          id="accounts"
          valueField="id"
          value={[...new Set([...transactionFilters.accounts, ...transferFilters.accounts])]}
          onChange={(accounts) => setFilter('accounts', accounts)}
          placeholder="Accounts"
          className="w-full"
        />
      </div>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex-grow w-[26rem]">
        <CategoryTypeahead
          multiple
          id="categories"
          valueField="id"
          value={transactionFilters.categories}
          onChange={handleCategoryChange}
          placeholder="Categories"
          className="w-full"
        />
      </div>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex items-center space-x-2">
        <Input
          type="number"
          id="min-amount"
          value={transactionFilters.amountRange[0] === undefined ? '' : transactionFilters.amountRange[0]}
          onChange={(e) =>
            handleAmountRangeChange([
              e.target.value === '' ? undefined : Number(e.target.value),
              transactionFilters.amountRange[1],
            ])
          }
          className="w-24"
          placeholder="Min"
        />
        <span className="text-sm">to</span>
        <Input
          type="number"
          id="max-amount"
          value={transactionFilters.amountRange[1] === undefined ? '' : transactionFilters.amountRange[1]}
          onChange={(e) =>
            handleAmountRangeChange([
              transactionFilters.amountRange[0],
              e.target.value === '' ? undefined : Number(e.target.value),
            ])
          }
          className="w-24"
          placeholder="Max"
        />
      </div>

      <Separator orientation="vertical" className="h-8" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={isLoading || !transactionFilters.activeCount}
            onClick={handleResetFilters}
          >
            <RotateCcw
              className={cn('h-4 w-4', {
                'animate-spin': isLoading,
              })}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reset all filters</p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-8" />

      <FiltersToggleButton activeCount={transactionFilters.activeCount} onClick={onFiltersDialogToggle} />
    </div>
  );
};

export default ListingControls;
