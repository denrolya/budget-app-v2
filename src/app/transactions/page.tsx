import { Edit, Filter, ListIcon, Plus, RefreshCw, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { Toggle } from '@/components/ui/toggle';
import Pagination from '@/components/common/Pagination';
import BulkCreateTableForm from '@/components/features/transactions/BulkCreateTableForm';
import FormattedListing from '@/components/features/transactions/FormattedListing';
import ListFiltersSheet from '@/components/features/transactions/ListFiltersSheet';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { useTransactions } from '@/hooks/useTransactions';

export const TransactionsListPage: React.FC = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const { openForm } = useFormContext();
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
  } = useTransactions();
  const onAddTransaction = () => openForm(FormType.Transaction);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [showBulkCreate, setShowBulkCreate] = useState<boolean>(false);
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.after || filters.before) count++;
    if (filters.categories?.length > 0) count++;
    if (filters.accounts?.length > 0) count++;
    if (filters.amountRange[0] !== 0 || filters.amountRange[1] !== Infinity) count++;
    if (filters.withNestedCategories) count++;
    if (filters.isDraft) count++;
    return count;
  }, [filters]);


  useHotkeys('arrowleft', () => currentPage > 1 && setCurrentPage(currentPage - 1));
  useHotkeys('arrowright', () => currentPage < totalPages && setCurrentPage(currentPage + 1));
  useHotkeys('b', () => setShowBulkCreate(!showBulkCreate));
  useHotkeys('f', () => setIsFiltersOpen(!isFiltersOpen), {}, [isFiltersOpen]);

  useEffect(() => {
    const hotkeys = [{
      windows: 'ArrowLeft',
      mac: 'ArrowLeft',
      description: 'Go to previous page',
    }, {
      windows: 'ArrowRight',
      mac: 'ArrowRight',
      description: 'Go to next page',
    }, {
      windows: 'B',
      mac: 'B',
      description: 'Toggle Bulk Create',
    }, {
      windows: 'F',
      mac: 'F',
      description: 'Toggle Filters Dialog',
    }];
    addPageHotkeys('Transactions List', hotkeys);

    return () => {
      removePageHotkeys('Transactions List');
    };
  }, [addPageHotkeys, removePageHotkeys]);

  return (
    <FullHeightPageContent>
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="flex flex-col space-y-4 p-0 md:p-3 bg-background md:bg-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="text-2xl font-bold">Transactions</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onAddTransaction}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">New Transaction</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    className="hidden md:flex"
                    pressed={showBulkCreate}
                    onClick={() => setShowBulkCreate(!showBulkCreate)}>
                    <ListIcon className="h-4 w-4" />
                    <span className="sr-only">Bulk Create</span>
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={refetch}>
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    className="relative"
                    pressed={isFiltersOpen}
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">Filter</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 px-1 py-0.5 text-[0.6rem] min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Filter</TooltipContent>
              </Tooltip>
            </div>
          </div>
          {selectedTransactions.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedTransactions.length} transaction(s) selected
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Bulk Edit</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Bulk Delete</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk Delete</TooltipContent>
              </Tooltip>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 bg-background md:bg-card flex-grow overflow-hidden">
          {showBulkCreate && (
            <div className="border-b bg-muted/50 supports-[backdrop-filter]:bg-muted/50">
              <div className="px-4 py-3">
                <BulkCreateTableForm />
              </div>
            </div>
          )}
          <ScrollArea className="h-full">
            <FormattedListing
              isLoading={isLoading}
              isError={isError}
              error={error}
              groupedItems={groupedItems}
              refetch={refetch}
              onAdd={onAddTransaction}
            />
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-end p-4 md:p-6 bg-background md:bg-card">
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

      {(isFetching && !isLoading) && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded">
          Updating...
        </div>
      )}

      <ListFiltersSheet
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        data={filters}
        onChange={setFilter}
        onReset={resetFilters} />
    </FullHeightPageContent>
  );
};

TransactionsListPage.displayName = 'TransactionsListPage';

export default TransactionsListPage;
