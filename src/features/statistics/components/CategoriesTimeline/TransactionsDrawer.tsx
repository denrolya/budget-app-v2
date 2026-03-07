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
import { useCategories } from '@/hooks/financeData';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useList as useTransactionsList } from '@/features/transactions';
import Category from '@/features/categories/models/Category';
import TransactionFilters from '@/features/transactions/models/TransactionFilters';

interface TransactionsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: number[];
  timeframe: {
    after: Moment;
    before: Moment;
  };
  fetchFromSubcategories?: boolean;
}

export const TransactionsDrawer: React.FC<TransactionsDrawerProps> = ({
  isOpen,
  onOpenChange,
  selectedCategories,
  timeframe,
  fetchFromSubcategories = true,
}) => {
  const { openForm } = useFormContext();
  const { list: allCategories } = useCategories();
  const categories = selectedCategories
    .map((id) => allCategories.find((category: Category) => category.id === id))
    .filter((c): c is Category => c !== undefined);
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
      withNestedCategories: fetchFromSubcategories,
    }),
  });

  useEffect(() => {
    if (isOpen && selectedCategories.length) {
      setFilter('categories', selectedCategories);
      setFilter('after', timeframe.after);
      setFilter('before', timeframe.before);
    }
  }, [isOpen, selectedCategories, timeframe, setFilter, refetchTransactions]);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Transactions in {categories.map((c) => c.name).join(', ')}</DrawerTitle>
          <DrawerDescription>
            {timeframe.after.format(MOMENT_DATEPICKER_FORMAT)} - {timeframe.before.format(MOMENT_DATEPICKER_FORMAT)}
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="h-[60vh] px-4">
          <FormattedListing
            error={transactionsError}
            groupedItems={groupedTransactions}
            isError={isTransactionsError}
            isLoading={isTransactionsLoading}
            refetch={refetchTransactions}
            onAdd={() => openForm(FormType.Transaction)}
          />
        </ScrollArea>
        <DrawerFooter>
          <Pagination
            currentPage={currentPage}
            isLoading={isTransactionsLoading}
            perPage={perPage}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionsDrawer;
