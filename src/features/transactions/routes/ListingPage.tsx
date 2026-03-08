import { CopyPlus, Download, PanelTopClose, PanelTopOpen, RefreshCw, RotateCcw, SquarePlus } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import Pagination from '@/components/common/Pagination';
import SummaryBadge from '@/components/common/SummaryBadge';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useIsMobile } from '@/hooks/use-mobile';

import { useList as useTransactionsList } from '../api';
import { useMutations } from '../api/mutations';
import { useListHotkeys as useHotkeys } from '../hooks/useHotkeys';
import TransactionHeatmapChart from '../components/TransactionHeatmapChart';
import BulkCreateTableForm from '../components/BulkCreateTableForm';
import FormattedListing from '../components/FormattedListing';
import InlineFilters from '../components/InlineFilters';
import ListFiltersSheet from '../components/ListFiltersSheet';

export const TransactionsListPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { openForm } = useFormContext();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(true);

  const {
    groupedItems,
    isLoading,
    isError,
    error,
    refetch,
    pagination: { currentPage, totalPages, perPage, totalItems, setCurrentPage, setPerPage },
    filters,
    setFilter,
    resetFilters,
    isFetching,
    totalValue,
    sort,
  } = useTransactionsList();

  const handleSortToggle = useCallback(() => {
    sort.setSort({ field: sort.field || 'executedAt', direction: sort.direction === 'desc' ? 'asc' : 'desc' });
  }, [sort]);

  const { exportTransactionsCsv, isExportingCsv } = useMutations({ invalidateKey: 'transactions' });

  const isUpdatingBannerVisible = isFetching && !isLoading;

  const bulkCreateAriaLabel = isBulkCreateOpen ? 'Hide bulk create' : 'Show bulk create';
  const filtersToggleAriaLabel = isFiltersOpen ? 'Close filters' : 'Open filters';

  const openNewTransactionForm = useCallback(() => {
    openForm(FormType.Transaction);
  }, [openForm]);

  const toggleFilters = useCallback(() => {
    setIsFiltersOpen((prev) => !prev);
  }, []);

  const toggleBulkCreate = useCallback(() => {
    setIsBulkCreateOpen((prev) => !prev);
  }, []);

  const refreshList = useCallback(() => {
    void refetch();
  }, [refetch]);

  const exportCsv = useCallback(() => {
    void exportTransactionsCsv(filters);
  }, [exportTransactionsCsv, filters]);

  useHotkeys({
    onPrevPage: () => currentPage > 1 && setCurrentPage(currentPage - 1),
    onNextPage: () => currentPage < totalPages && setCurrentPage(currentPage + 1),
    onFiltersToggle: toggleFilters,
    onBulkCreateToggle: toggleBulkCreate,
  });

  return (
    <FullHeightPageContent>
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="p-0 md:p-3 bg-background md:bg-card md:border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-bold">Transactions</CardTitle>

            <div aria-label="Transactions actions" role="toolbar" className="flex flex-wrap items-center gap-2">
              <SummaryBadge count={totalItems} icon={ROUTES.TRANSACTION_LIST.icon} value={totalValue} />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    aria-label={bulkCreateAriaLabel}
                    aria-pressed={isBulkCreateOpen}
                    pressed={isBulkCreateOpen}
                    type="button"
                    variant="outline"
                    className="hidden md:flex"
                    onPressedChange={setIsBulkCreateOpen}
                  >
                    <CopyPlus aria-hidden="true" className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="New transaction"
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={openNewTransactionForm}
                  >
                    <SquarePlus aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Export current transactions to CSV"
                    disabled={isExportingCsv}
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={exportCsv}
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export CSV</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Refresh transactions list"
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
        </CardHeader>

        <CardContent className="p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {isHeatmapVisible && (
            <div className="shrink-0 border-b">
              <TransactionHeatmapChart
                accountIds={(filters.accounts as string[]).map(Number)}
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

          {isBulkCreateOpen && (
            <div className="shrink-0 border-b bg-muted/50 supports-[backdrop-filter]:bg-muted/50">
              <div className="px-2 py-2 md:px-0 md:py-3">
                <BulkCreateTableForm />
              </div>
            </div>
          )}

          <ScrollArea aria-label="Transactions list" className="flex-1 min-h-0">
            <FormattedListing
              error={error}
              groupedItems={groupedItems}
              isError={isError}
              isLoading={isLoading}
              refetch={refetch}
              onAdd={openNewTransactionForm}
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

TransactionsListPage.displayName = 'TransactionsListPage';

export default TransactionsListPage;
