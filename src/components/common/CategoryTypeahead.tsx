import { forwardRef } from 'react';

import TypeaheadV2 from '@/components/ui/typeaheadV2';
import { useExpenseCategories, useIncomeCategories } from '@/contexts/FinanceData';
import Category from '@/models/Category';
import { Type as TransactionType } from '@/models/Transaction';

interface CategoryTypeaheadProps {
  multiple?: boolean;
  value: number | number[] | string | string[] | null;
  onChange: (value: number | number[] | string | string[] | null) => void;
  className?: string;
  type?: TransactionType;
}

const CategoryTypeahead = forwardRef<HTMLInputElement, CategoryTypeaheadProps>(({
                                                                                  multiple = false,
                                                                                  value,
                                                                                  onChange,
                                                                                  className,
                                                                                  type,
                                                                                }, ref) => {
  const incomeCategories = useIncomeCategories();
  const expenseCategories = useExpenseCategories();

  const renderElement = (el: Category) => (
    <>
      <div className="flex flex-col">
        <span>{el.name}</span>
        <span className="text-xs text-muted-foreground">
          {el.getFullPath().join(' > ')}
        </span>
      </div>
      <div className="ml-auto flex items-center space-x-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: el.color }}></span>
        <span className="text-xs font-medium">{el.type}</span>
      </div>
    </>
  );

  let options = incomeCategories.concat(expenseCategories);
  if (type === TransactionType.Income) {
    options = incomeCategories;
  } else if (type === TransactionType.Expense) {
    options = expenseCategories;
  }

  return (
    <TypeaheadV2
      valueField="id"
      labelField="name"
      groupBy={type}
      placeholder={multiple ? 'Select categories...' : 'Select a category...'}
      multiple={multiple}
      options={options}
      renderElement={renderElement}
      value={value}
      onChange={onChange}
      className={className}
      ref={ref}
    />
  );
});

export default CategoryTypeahead;
