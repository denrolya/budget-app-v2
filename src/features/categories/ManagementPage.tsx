import React, { useState } from 'react';

import CategoryDetails from '@/features/categories/components/Details';
import DetailsHeader from '@/features/categories/components/DetailsHeader';
import SidebarListing from '@/features/categories/components/SidebarListing';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenseCategoriesTree, useIncomeCategoriesTree } from '@/contexts/FinanceData';
import Category from '@/models/Category';
import { Type as TransactionType } from '@/types/transaction';
import CategoriesSunburst from '@/features/sandbox/components/Sunburst.example';

export const CategoryManagementPage: React.FC = () => {
  const [incomeCategories, expenseCategories] = [useIncomeCategoriesTree(), useExpenseCategoriesTree()];
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>(TransactionType.Expense);

  return (
    <PageWithSidebar contentScrollable={false}>
      <PageWithSidebar.Sidebar>
        <SidebarListing
          selected={selectedCategory}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          setShowDetails={setShowDetails}
          onSelect={setSelectedCategory}
        />
      </PageWithSidebar.Sidebar>
      {(selectedCategory && showDetails) && (
        <PageWithSidebar.Header
          overrideContent
          title={`${selectedCategory.name}`}
          className="p-2"
          onBack={() => setSelectedCategory(null)}>
          <DetailsHeader selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
        </PageWithSidebar.Header>
      )}
      <PageWithSidebar.Content>
        {(selectedCategory && showDetails) && (
          <CategoryDetails category={selectedCategory} />
        )}

        {(!selectedCategory || !showDetails) && (
          <div className="flex items-center justify-center h-full bg-muted p-4">
            <Card className="w-full h-full">
              <CardHeader className="sr-only">
                <CardTitle>Data</CardTitle>
                <CardDescription className="sr-only">Timeline of changes related to this category</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoriesSunburst
                  categories={selectedType === TransactionType.Income ? incomeCategories : expenseCategories}
                  height="100vh" />
              </CardContent>
            </Card>
          </div>
        )}
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default CategoryManagementPage;
