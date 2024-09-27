import { forwardRef } from 'react';

import TypeaheadV2 from '@/components/ui/typeaheadV2';
import { useCategories } from '@/contexts/FinanceData';
import Category from '@/models/Category';

interface CategoryTypeaheadProps {
  multiple?: boolean;
  value: number | number[] | string | string[] | null;
  onChange: (value: number | number[] | string | string[] | null) => void;
  className?: string;
}

const CategoryTypeahead = forwardRef<HTMLInputElement, CategoryTypeaheadProps>(({
                                                                                  multiple = false,
                                                                                  value,
                                                                                  onChange,
                                                                                  className,
                                                                                }, ref) => {
  const { list: categories } = useCategories();

  const getPath = (category: Category): string => {
    let path = category.name;
    let current = category.parent;
    while (current) {
      path = `${current.name} > ${path}`;
      current = current.parent;
    }
    return path;
  };

  const renderElement = (el: Category) => (
    <>
      <div className="flex flex-col">
        <span>{el.name}</span>
        <span className="text-xs text-muted-foreground">
          {getPath(el)}
        </span>
      </div>
      <div className="ml-auto flex items-center space-x-2">
        <span className={'w-3 h-3 rounded-full'} style={{ backgroundColor: el.color }}></span>
        <span className="text-xs font-medium">{el.type}</span>
      </div>
    </>
  );

  return (
    <TypeaheadV2
      valueField="id"
      labelField="name"
      placeholder={multiple ? 'Select categories...' : 'Select a category...'}
      multiple={multiple}
      options={categories}
      renderElement={renderElement}
      value={value}
      onChange={onChange}
      className={className}
      ref={ref}
    />
  );
});

export default CategoryTypeahead;
