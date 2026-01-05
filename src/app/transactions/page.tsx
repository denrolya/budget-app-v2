import { CopyPlus, Download, RefreshCw, SquarePlus } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { useListHotkeys as useHotkeys } from '@/app/transactions/hooks/useHotkeys';
import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import Pagination from '@/components/common/Pagination';
import SummaryBadge from '@/components/common/SummaryBadge';
import BulkCreateTableForm from '@/components/features/transactions/BulkCreateTableForm';
import FormattedListing from '@/components/features/transactions/FormattedListing';
import InlineFilters from '@/components/features/transactions/InlineFilters';
import ListFiltersSheet from '@/components/features/transactions/ListFiltersSheet';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTransactionMutations } from '@/hooks/useTransactionMutations';
import { useTransactions } from '@/hooks/useTransactions';

export const TransactionsListPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { openForm } = useFormContext();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);

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
  } = useTransactions();

  const { exportTransactionsCsv, isExportingCsv } = useTransactionMutations('transactions');

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

            <div role="toolbar" aria-label="Transactions actions" className="flex flex-wrap items-center gap-2">
              <SummaryBadge
                icon={ROUTES.TRANSACTION_LIST.icon}
                count={totalItems}
                value={totalValue}
              />

              <FiltersToggleButton
                className="flex md:hidden"
                activeCount={filters.activeCount}
                onClick={toggleFilters}
                aria-label={filtersToggleAriaLabel}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    type="button"
                    variant="outline"
                    className="hidden md:flex"
                    pressed={isBulkCreateOpen}
                    onPressedChange={setIsBulkCreateOpen}
                    aria-label={bulkCreateAriaLabel}
                    aria-pressed={isBulkCreateOpen}
                  >
                    <CopyPlus className="h-4 w-4" aria-hidden="true" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={openNewTransactionForm}
                    aria-label="New transaction"
                  >
                    <SquarePlus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={exportCsv}
                    disabled={isExportingCsv}
                    aria-label="Export current transactions to CSV"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export CSV</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={refreshList}
                    disabled={isLoading}
                    aria-label="Refresh transactions list"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </div>
          </div>
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

          {isBulkCreateOpen && (
            <div className="shrink-0 border-b bg-muted/50 supports-[backdrop-filter]:bg-muted/50">
              <div className="px-4 py-3">
                <BulkCreateTableForm />
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 min-h-0" aria-label="Transactions list">
            <FormattedListing
              isLoading={isLoading}
              isError={isError}
              error={error}
              groupedItems={groupedItems}
              refetch={refetch}
              onAdd={openNewTransactionForm}
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

TransactionsListPage.displayName = 'TransactionsListPage';

export default TransactionsListPage;
