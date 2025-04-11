import { Moment } from 'moment/moment';
import React, { useEffect } from 'react';

import Pagination from '@/components/common/Pagination';
import FormattedListing from '@/components/features/transactions/FormattedListing';
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
import { useCategories } from '@/contexts/FinanceData';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactions } from '@/hooks/useTransactions';
import Category from '@/models/Category';
import TransactionFilters from '@/models/TransactionFilters';

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
    .filter(Boolean);
  const {
    groupedItems: groupedTransactions,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    error: transactionsError,
    refetch: refetchTransactions,
    pagination: { currentPage, perPage, totalPages, totalItems, setCurrentPage, setPerPage },
    setFilter,
  } = useTransactions({
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
