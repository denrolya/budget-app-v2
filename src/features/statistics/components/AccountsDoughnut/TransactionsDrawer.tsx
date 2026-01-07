import { Moment } from 'moment/moment';
import React, { useEffect } from 'react';

import Pagination from '@/components/common/Pagination';
import FormattedListing from '@/features/transactions/components/FormattedListing';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useList as useTransactionsList } from '@/features/transactions';
import TransactionFilters from '@/features/transactions/models/TransactionFilters';

interface ProcessedCategory {
  id: number;
  name: string;
  value: number;
  children?: ProcessedCategory[];
}

interface TransactionsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategory: ProcessedCategory;
  timeframe: {
    after: Moment;
    before: Moment;
  };
}

export const TransactionsDrawer: React.FC<TransactionsDrawerProps> = ({
  isOpen,
  onOpenChange,
  selectedCategory,
  timeframe,
}) => {
  const { openForm } = useFormContext();
  const {
    groupedItems: groupedTransactions,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    error: transactionsError,
    refetch: refetchTransactions,
    pagination: { currentPage, perPage, totalPages, totalItems, setCurrentPage, setPerPage },
    setFilter,
  } = useTransactionsList({
    updateUrl: false,
    initialFilters: new TransactionFilters({
      withNestedCategories: true,
    }),
  });

  useEffect(() => {
    if (isOpen && selectedCategory.id) {
      setFilter('categories', [selectedCategory.id]);
      setFilter('after', timeframe.after);
      setFilter('before', timeframe.before);
    }
  }, [isOpen, selectedCategory, timeframe, setFilter, refetchTransactions]);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Transactions in {selectedCategory.name}</DrawerTitle>
          <DrawerDescription>
            {timeframe.after.format(MOMENT_DATEPICKER_FORMAT)} - {timeframe.before.format(MOMENT_DATEPICKER_FORMAT)}
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="h-[60vh] px-4">
          <FormattedListing
            error={transactionsError}
            isError={isTransactionsError}
            isLoading={isTransactionsLoading}
            groupedItems={groupedTransactions}
            refetch={refetchTransactions}
            onAdd={() => openForm(FormType.Transaction)}
          />
        </ScrollArea>
        <DrawerFooter>
          <Pagination
            isLoading={isTransactionsLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
            perPage={perPage}
            totalItems={totalItems}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionsDrawer;
