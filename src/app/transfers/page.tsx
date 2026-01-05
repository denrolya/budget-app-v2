import { Edit, Plus, RefreshCw, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { useListHotkeys as useHotkeys } from '@/app/transfers/hooks/useHotkeys';
import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import Pagination from '@/components/common/Pagination';
import SummaryBadge from '@/components/common/SummaryBadge';
import FormattedListing from '@/components/features/transfers/FormattedListing';
import InlineFilters from '@/components/features/transfers/InlineFilters';
import ListFiltersSheet from '@/components/features/transfers/ListFiltersSheet';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTransfers } from '@/hooks/useTransfers';

export const TransfersListPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { openForm } = useFormContext();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
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
  } = useTransfers();

  const isUpdatingBannerVisible = isFetching && !isLoading;

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

            <div role="toolbar" aria-label="Transfers actions" className="flex flex-wrap items-center gap-2">
              <SummaryBadge
                useColors={false}
                icon={ROUTES.TRANSFER_LIST.icon}
                count={totalItems}
                value={totalValue}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={openNewTransferForm}
                    aria-label="Create a new transfer"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transfer</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={refreshList}
                    disabled={isLoading}
                    aria-label="Refresh transfers list"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

              <FiltersToggleButton
                className="flex md:hidden"
                activeCount={filters.activeCount}
                onClick={toggleFilters}
                aria-label={filtersToggleAriaLabel}
              />
            </div>
          </div>

          {bulkSelectionVisible && (
            <div className="flex items-center gap-2 px-3 pb-3 md:px-0 md:pb-0">
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {selectedTransfers.length} transfer(s) selected
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label="Bulk edit selected transfers">
                    <Edit className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label="Bulk delete selected transfers">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk Delete</TooltipContent>
              </Tooltip>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {!isMobile && (
            <div className="shrink-0">
              <InlineFilters
                data={filters}
                onChange={setFilter}
                onReset={resetFilters}
                isLoading={isLoading}
                onFiltersDialogToggle={toggleFilters}
              />
            </div>
          )}

          <ScrollArea className="flex-1 min-h-0" aria-label="Transfers list">
            <FormattedListing
              isLoading={isLoading}
              isError={isError}
              error={error}
              groupedItems={groupedItems}
              refetch={refetch}
              onAdd={openNewTransferForm}
            />
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex justify-end p-2 bg-background md:bg-card border-t">
          <Pagination
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
            perPage={perPage}
            totalItems={totalItems}
          />
        </CardFooter>
      </Card>

      {isUpdatingBannerVisible && (
        <div
          className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded shadow"
          role="status"
          aria-live="polite"
        >
          Updating…
        </div>
      )}

      <ListFiltersSheet
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        data={filters}
        onChange={setFilter}
        onReset={resetFilters}
      />
    </FullHeightPageContent>
  );
};

TransfersListPage.displayName = 'TransfersListPage';

export default TransfersListPage;
