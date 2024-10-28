import { ChevronLeft, ChevronRight, Download, Edit, Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import FormattedListing from '@/components/features/transactions/FormattedListing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactions } from '@/hooks/useTransactions';
import Category from '@/models/Category';
import { TransactionFilters } from '@/models/TransactionFilters';

interface Props {
  category: Category;
}

export const CategoryDetails: React.FC<Props> = ({ category }) => {
  const { openForm } = useFormContext();
  const [activeTab, setActiveTab] = useState('activity');
  const {
    groupedItems: groupedTransactions,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    error: transactionsError,
    refetch: refetchTransactions,
    setFilter,
    pagination: { currentPage, totalPages, perPage, totalItems, setCurrentPage, setPerPage },
  } = useTransactions({
    updateUrl: false,
    initialFilters: new TransactionFilters({
      withNestedCategories: true,
    }),
  });

  useEffect(() => {
    setFilter('categories', [category?.id]);
  }, [category, setFilter]);

  const onAddTransaction = () => openForm(FormType.Transaction, { category });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Transactions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription className="sr-only">Activity for the past month</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <FormattedListing
                    isLoading={isTransactionsLoading}
                    isError={isTransactionsError}
                    error={transactionsError}
                    groupedItems={groupedTransactions}
                    refetch={refetchTransactions}
                    onAdd={onAddTransaction}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    onPerPageChange={setPerPage}
                    perPage={perPage}
                    totalItems={totalItems}
                  />
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button onClick={onAddTransaction}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Category History</CardTitle>
                <CardDescription className="sr-only">Timeline of changes related to this category</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Empty content for now */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CategoryDetails;
