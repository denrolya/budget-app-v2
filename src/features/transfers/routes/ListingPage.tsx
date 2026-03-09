import { Edit, PanelTopClose, PanelTopOpen, RefreshCw, RotateCcw, SquarePlus, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import Pagination from '@/components/common/Pagination';
import SummaryBadge from '@/components/common/SummaryBadge';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { HeatmapPanel } from '@/features/transactions';
import FormattedListing from '@/features/transfers/components/FormattedListing';
import InlineFilters from '@/features/transfers/components/InlineFilters';
import ListFiltersSheet from '@/features/transfers/components/ListFiltersSheet';
import { useListHotkeys as useHotkeys } from '@/features/transfers/hooks/useHotkeys';
import { useIsMobile } from '@/hooks/use-mobile';

import { useList } from '../api';

export const TransfersListPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { openForm } = useFormContext();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(true);
  const [selectedTransfers] = useState<number[]>([]); // placeholder until bulk-select is implemented

  const {
    groupedItems,
    isLoading,
    isError,
    error,
    refetch,
    pagination: { currentPage, totalPages, totalItems, perPage, setCurrentPage, setPerPage },
    filters,
    setFilter,
    resetFilters,
    isFetching,
    totalValue,
    sort,
  } = useList();

  const isUpdatingBannerVisible = isFetching && !isLoading;

  const highlightDates = useMemo(
    () => groupedItems.map(([date]) => date.format('YYYY-MM-DD')),
    [groupedItems],
  );

  const handleSortToggle = useCallback(() => {
    sort.setSort({ field: sort.field || 'executedAt', direction: sort.direction === 'desc' ? 'asc' : 'desc' });
  }, [sort]);

  const openNewTransferForm = useCallback(() => {
    openForm(FormType.Transfer);
  }, [openForm]);

  const toggleFilters = useCallback(() => {
    setIsFiltersOpen((prev) => !prev);
  }, []);

  const refreshList = useCallback(() => {
    void refetch();
  }, [refetch]);

  useHotkeys({
    onFiltersToggle: toggleFilters,
    onPrevPage: () => currentPage > 1 && setCurrentPage(currentPage - 1),
    onNextPage: () => currentPage < totalPages && setCurrentPage(currentPage + 1),
  });

  const bulkSelectionVisible = selectedTransfers.length > 0;
  const filtersToggleAriaLabel = isFiltersOpen ? 'Close filters' : 'Open filters';

  return (
    <FullHeightPageContent>
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="p-0 md:p-3 bg-background md:bg-card md:border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-bold">Transfers</CardTitle>

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
                    disabled={isLoading}
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={refreshList}
                  >
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

              {filters.activeCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Reset filters"
                      size="icon"
                      type="button"
                      variant="outline"
                      onClick={resetFilters}
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
                    onClick={() => setIsHeatmapVisible((v) => !v)}
                  >
                    {isHeatmapVisible ? (
                      <PanelTopClose aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <PanelTopOpen aria-hidden="true" className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isHeatmapVisible ? 'Hide heatmap' : 'Show heatmap'}</TooltipContent>
              </Tooltip>

              <FiltersToggleButton
                activeCount={filters.activeCount}
                aria-label={filtersToggleAriaLabel}
                onClick={toggleFilters}
              />
            </div>
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
                highlightDates={highlightDates}
                onRangeClear={() => {
                  setFilter('after', moment().subtract(30, 'days').startOf('day'));
                  setFilter('before', moment().endOf('day'));
                }}
                onRangeSelect={(after, before) => {
                  setFilter('after', after);
                  setFilter('before', before);
                }}
              />
            </div>
          )}

          {!isMobile && (
            <div className="shrink-0">
              <InlineFilters
                data={filters}
                sortDirection={sort.direction}
                onChange={setFilter}
                onSortToggle={handleSortToggle}
              />
            </div>
          )}

          <ScrollArea aria-label="Transfers list" className="flex-1 min-h-0">
            <FormattedListing
              error={error}
              groupedItems={groupedItems}
              isError={isError}
              isLoading={isLoading}
              refetch={refetch}
              onAdd={openNewTransferForm}
            />
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex justify-end p-2 bg-background md:bg-card border-t">
          <Pagination
            currentPage={currentPage}
            isLoading={isLoading}
            perPage={perPage}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </CardFooter>
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
        data={filters}
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        onChange={setFilter}
        onReset={resetFilters}
      />
    </FullHeightPageContent>
  );
};

TransfersListPage.displayName = 'TransfersListPage';

export default TransfersListPage;
