import { Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import CategoriesSunburst from '@/components/features/statistics/Sunburst.example';
import FormattedListing from '@/components/features/transactions/FormattedListing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 overflow-auto">
        <Tabs className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="activity">Transactions</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <Card>
              <CardHeader className="sr-only">
                <CardTitle>Activity</CardTitle>
                <CardDescription>Activity for the past month</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-row justify-between p-4">
                  <span />
                  <Button size="icon" className="rounded-full" onClick={onAddTransaction}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add item</span>
                  </Button>
                </div>
                <ScrollArea className="h-[400px] p-0">
                  <FormattedListing
                    isLoading={isTransactionsLoading}
                    isError={isTransactionsError}
                    error={transactionsError}
                    groupedItems={groupedTransactions}
                    refetch={refetchTransactions}
                    onAdd={onAddTransaction}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data</CardTitle>
                <CardDescription className="sr-only">Timeline of changes related to this category</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoriesSunburst categories={[category]} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CategoryDetails;
