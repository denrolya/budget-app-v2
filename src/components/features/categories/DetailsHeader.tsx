import { ChevronLeft, ChevronRight, Download, Edit } from 'lucide-react';
import React from 'react';

import Category from '@/models/Category';
import { Button } from '@/components/ui/button';

const generateBreadcrumbs = (category: Category): Category[] => {
  const breadcrumbs: Category[] = [];
  let currentCategory: Category | null = category;

  while (currentCategory) {
    breadcrumbs.unshift(currentCategory);
    currentCategory = currentCategory.parent;
  }

  return breadcrumbs;
};

interface Props {
  selectedCategory: Category;
  onCategorySelect: (category: Category | null) => void;
}

export const DetailsHeader: React.FC<Props> = ({ selectedCategory, onCategorySelect }) => {
  const handleEditClick = () => {
    console.log('Edit button clicked');
  };

  const breadcrumbs = generateBreadcrumbs(selectedCategory);
  return (
    <div className="flex justify-between items-start sm:items-center w-full">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" onClick={() => onCategorySelect(null)}>
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Back to list</span>
        </Button>
        <div className="flex flex-col space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold">{selectedCategory.name}</h1>
          {breadcrumbs.length > 1 && (
            <nav
              aria-label="Breadcrumbs"
              className="flex items-center space-x-1 text-sm text-muted-foreground overflow-x-auto"
            >
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.id}>
                  {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-foreground">{breadcrumb.name}</span>
                  ) : (
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal text-muted-foreground whitespace-nowrap"
                      onClick={() => onCategorySelect(breadcrumb)}
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
  );
};

export default DetailsHeader;
