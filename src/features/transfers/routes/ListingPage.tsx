import { Edit, PanelTopClose, PanelTopOpen, RefreshCw, RotateCcw, SquarePlus, Trash2 } from 'lucide-react';
import moment, { type Moment } from 'moment';
import React, { useCallback, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import SummaryBadge from '@/components/common/SummaryBadge';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { usePageHeaderTitle } from '@/components/layout/header/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { LedgerView, useLedger } from '@/features/daily-ledger';
import { HeatmapPanel } from '@/features/transactions';
import InlineFilters from '@/features/transfers/components/InlineFilters';
import ListFiltersSheet from '@/features/transfers/components/ListFiltersSheet';
import { useIsMobile } from '@/hooks/use-mobile';

const DEFAULT_HEATMAP_RANGE = {
  after: moment().subtract(30, 'days').startOf('day'),
  before: moment().endOf('day'),
};

export const TransfersListPage: React.FC = () => {
  usePageHeaderTitle('Transfers');

  const isMobile = useIsMobile();
  const { openForm } = useFormContext();
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(true);
  const [selectedTransfers] = useState<number[]>([]); // placeholder until bulk-select is implemented

  const ledger = useLedger({
    updateUrl: true,
    omitTransactions: true,
  });

  const totalItems = ledger.transfersState.pagination.totalItems;
  const totalValue = ledger.transfersState.totalValue;
  const isUpdatingBannerVisible = ledger.isFetching && !ledger.isLoading;
  const bulkSelectionVisible = selectedTransfers.length > 0;

  const openNewTransferForm = useCallback(() => openForm(FormType.Transfer), [openForm]);

  const handleFilterChange = useCallback(
    (key: string, value: unknown) => {
      if (key === 'after' && value) {
        ledger.setTimeframe({ after: value as Moment, before: ledger.timeframe.before });
        return;
      }
      if (key === 'before' && value) {
        ledger.setTimeframe({ after: ledger.timeframe.after, before: value as Moment });
        return;
      }
      ledger.setFilter(key, value);
    },
    [ledger],
  );

  const handleHeatmapRangeSelect = useCallback(
    (after: Moment, before: Moment) => ledger.setTimeframe({ after, before }),
    [ledger],
  );

  const handleHeatmapRangeClear = useCallback(() => ledger.setTimeframe(DEFAULT_HEATMAP_RANGE), [ledger]);

  const handleSortToggle = useCallback(() => ledger.setIsReversedOrder(!ledger.isReversedOrder), [ledger]);

  const toggleHeatmap = useCallback(() => setIsHeatmapVisible((v) => !v), []);

  const heatmapIcon = isHeatmapVisible ? (
    <PanelTopClose aria-hidden="true" className="h-4 w-4" />
  ) : (
    <PanelTopOpen aria-hidden="true" className="h-4 w-4" />
  );

  return (
    <FullHeightPageContent>
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="p-0 md:p-3 bg-background md:bg-card md:border-b">
          <div className="hidden md:flex md:items-start md:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <InlineFilters
                inHeader
                data={ledger.transferFilters}
                sortDirection={ledger.isReversedOrder ? 'desc' : 'asc'}
                onChange={handleFilterChange as any}
                onSortToggle={handleSortToggle}
              />
            </div>

            <div aria-label="Transfers actions" role="toolbar" className="flex flex-wrap items-center gap-2">
              <SummaryBadge count={totalItems} icon={ROUTES.TRANSFER_LIST.icon} useColors={false} value={totalValue} />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Create a new transfer"
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={openNewTransferForm}
                  >
                    <SquarePlus aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transfer</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Refresh transfers list"
                    disabled={ledger.isLoading}
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={ledger.refetch}
                  >
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

              {ledger.activeFilterCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Reset filters"
                      size="icon"
                      type="button"
                      variant="outline"
                      onClick={ledger.resetAll}
                    >
                      <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset filters</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={isHeatmapVisible ? 'Hide heatmap' : 'Show heatmap'}
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={toggleHeatmap}
                  >
                    {heatmapIcon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isHeatmapVisible ? 'Hide heatmap' : 'Show heatmap'}</TooltipContent>
              </Tooltip>

              <FiltersToggleButton
                activeCount={ledger.activeFilterCount}
                aria-label={ledger.isFiltersOpen ? 'Close filters' : 'Open filters'}
                onClick={ledger.toggleFilters}
              />
            </div>
          </div>

          <div className="md:hidden flex justify-end">
            <FiltersToggleButton
              activeCount={ledger.activeFilterCount}
              aria-label={ledger.isFiltersOpen ? 'Close filters' : 'Open filters'}
              onClick={ledger.toggleFilters}
            />
          </div>

          {bulkSelectionVisible && (
            <div className="flex items-center gap-2 px-3 pb-3 md:px-0 md:pb-0">
              <span aria-live="polite" className="text-sm text-muted-foreground">
                {selectedTransfers.length} transfer(s) selected
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button aria-label="Bulk edit selected transfers" size="icon" type="button" variant="outline">
                    <Edit aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button aria-label="Bulk delete selected transfers" size="icon" type="button" variant="outline">
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk Delete</TooltipContent>
              </Tooltip>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {isHeatmapVisible && (
            <div className="shrink-0 border-b">
              <HeatmapPanel
                highlightDates={ledger.visibleDates}
                showViewMode={false}
                year={ledger.timeframe.after.year()}
                onRangeClear={handleHeatmapRangeClear}
                onRangeSelect={handleHeatmapRangeSelect}
              />
            </div>
          )}

          <LedgerView ledger={ledger} showControls={false} showFiltersSheet={false} />
        </CardContent>
      </Card>

      {isUpdatingBannerVisible && (
        <div
          aria-live="polite"
          role="status"
          className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded shadow"
        >
          Updating…
        </div>
      )}

      <ListFiltersSheet
        data={ledger.transferFilters}
        isOpen={ledger.isFiltersOpen}
        setIsOpen={ledger.setIsFiltersOpen}
        onChange={handleFilterChange as any}
        onReset={ledger.resetAll}
      />
    </FullHeightPageContent>
  );
};

TransfersListPage.displayName = 'TransfersListPage';

export default TransfersListPage;
