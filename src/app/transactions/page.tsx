import { Edit, Filter, ListIcon, Plus, RefreshCw, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import Pagination from '@/components/common/Pagination';
import BulkCreateTableForm from '@/components/features/transactions/BulkCreateTableForm';
import FormattedListing from '@/components/features/transactions/FormattedListing';
import ListFiltersSheet from '@/components/features/transactions/ListFiltersSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactions } from '@/hooks/useTransactions';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';

export const TransactionsListPage: React.FC = () => {
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

  return (
    <FullHeightPageContent>
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="flex flex-col space-y-4 p-0 md:p-6 bg-background md:bg-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="text-2xl font-bold">Transactions</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onAddTransaction}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">New Transaction</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden md:flex"
                    onClick={() => setShowBulkCreate(!showBulkCreate)}>
                    <ListIcon className="h-4 w-4" />
                    <span className="sr-only">Bulk Create</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={refetch}>
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ListFiltersSheet data={filters} onChange={setFilter} onReset={resetFilters}>
                    <Button variant="outline" size="icon" className="relative">
                      <Filter className="h-4 w-4" />
                      <span className="sr-only">Filter</span>
                      {activeFiltersCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 px-1 py-0.5 text-[0.6rem] min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </ListFiltersSheet>
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
    </FullHeightPageContent>
  );
};

TransactionsListPage.displayName = 'TransactionsListPage';

export default TransactionsListPage;
