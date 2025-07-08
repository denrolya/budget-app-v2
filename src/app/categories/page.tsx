import React, { useState } from 'react';

import CategoryDetails from '@/components/features/categories/Details';
import DetailsHeader from '@/components/features/categories/DetailsHeader';
import SidebarListing from '@/components/features/categories/SidebarListing';
import CategoriesSunburst from '@/components/features/statistics/Sunburst.example';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenseCategoriesTree, useIncomeCategoriesTree } from '@/contexts/FinanceData';
import Category from '@/models/Category';
import { Type as TransactionType } from '@/types/transaction';

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
          onSelect={setSelectedCategory}
          setShowDetails={setShowDetails}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
      </PageWithSidebar.Sidebar>
      {(selectedCategory && showDetails) && (
        <PageWithSidebar.Header
          overrideContent
          className="p-2"
          title={`${selectedCategory.name}`}
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
                  height="100vh"
                  categories={selectedType === TransactionType.Income ? incomeCategories : expenseCategories} />
              </CardContent>
            </Card>
          </div>
        )}
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default CategoryManagementPage;
