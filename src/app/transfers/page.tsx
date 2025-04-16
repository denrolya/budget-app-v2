import { Edit, Filter, Plus, RefreshCw, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { Toggle } from '@/components/ui/toggle';
import Pagination from '@/components/common/Pagination';
import FormattedListing from '@/components/features/transfers/FormattedListing';
import ListFiltersSheet from '@/components/features/transfers/ListFiltersSheet';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useListHotkeys as useHotkeys } from '@/app/transfers/hooks/useHotkeys';
import { useTransfers } from '@/hooks/useTransfers';

export const TransfersListPage: React.FC = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [selectedTransfers] = useState<number[]>([]);
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
  } = useTransfers();
  const { openForm } = useFormContext();
  const onAddTransfer = () => openForm(FormType.Transfer);

  useHotkeys({
    onFiltersToggle: () => setIsFiltersOpen(!isFiltersOpen),
    onPrevPage: () => currentPage > 1 && setCurrentPage(currentPage - 1),
    onNextPage: () => currentPage < totalPages && setCurrentPage(currentPage + 1),
  });

  return (
    <FullHeightPageContent>
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="flex flex-col space-y-4 p-0 md:p-3 bg-background md:bg-card border-b-none md:border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="text-2xl font-bold">Transfers</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onAddTransfer}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">New Transfer</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transfer</TooltipContent>
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
                  <Toggle className="relative" pressed={isFiltersOpen} onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">Filter</span>
                    {filters.activeCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 px-1 py-0.5 text-[0.6rem] min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full">
                        {filters.activeCount}
                      </Badge>
                    )}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Filter</TooltipContent>
              </Tooltip>
            </div>
          </div>
          {selectedTransfers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{selectedTransfers.length} transfer(s) selected</span>
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
          <ScrollArea className="h-full">
            <FormattedListing
              isLoading={isLoading}
              isError={isError}
              error={error}
              groupedItems={groupedItems}
              refetch={refetch}
              onAdd={onAddTransfer}
            />
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-end p-2 bg-background md:bg-card">
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

      {isFetching && !isLoading && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded">Updating...</div>
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
