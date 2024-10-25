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
  setSelectedCategory: (category: Category | null) => void;
  allCategories: Category[];
}

const generateBreadcrumbs = (category: Category): Category[] => {
  const breadcrumbs: Category[] = [];
  let currentCategory: Category | null = category;

  while (currentCategory) {
    breadcrumbs.unshift(currentCategory);
    currentCategory = currentCategory.parent;
  }

  return breadcrumbs;
};

export const CategoryDetails: React.FC<Props> = ({ category, setSelectedCategory }) => {
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

  const handleEditClick = () => {
    console.log('Edit button clicked');
  };

  const breadcrumbs = generateBreadcrumbs(category);

  return (
    <div className="h-full flex flex-col">
      <header className="bg-background border-b p-4 space-y-4">
        <div className="flex justify-between items-start sm:items-center">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)}>
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back to list</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {category.name}
              </h1>
              {breadcrumbs.length > 1 && (
                <nav
                  aria-label="Breadcrumbs"
                  className="flex items-center space-x-1 text-sm text-muted-foreground overflow-x-auto mt-1">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={breadcrumb.id}>
                      {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="font-medium text-foreground">{breadcrumb.name}</span>
                      ) : (
                        <Button
                          variant="link"
                          className="p-0 h-auto font-normal whitespace-nowrap"
                          onClick={() => setSelectedCategory(breadcrumb)}
                        >
                          {breadcrumb.name}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleEditClick}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        </div>
      </header>

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
