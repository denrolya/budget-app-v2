import React, { useState } from 'react';

import CategoryDetails from '@/components/features/categories/Details';
import DetailsHeader from '@/components/features/categories/DetailsHeader';
import SidebarListing from '@/components/features/categories/SidebarListing';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { ROUTES } from '@/constants/routes';
import Category from '@/models/Category';

export const CategoryManagementPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { icon: Icon } = ROUTES.CATEGORIES_PAGE;

  return (
    <PageWithSidebar contentScrollable={false}>
      <PageWithSidebar.Sidebar>
        <SidebarListing
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          setShowDetails={setShowDetails}
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
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Icon className="h-8 w-8 text-primary/60" />
              </div>
              <p className="text-muted-foreground max-w-[250px]">
                Select a category from the sidebar to view details
              </p>
            </div>
          </div>
        )}
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default CategoryManagementPage;
