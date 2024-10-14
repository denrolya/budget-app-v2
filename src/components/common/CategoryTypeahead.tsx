import { forwardRef } from 'react';

import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import { useExpenseCategories, useIncomeCategories } from '@/contexts/FinanceData';
import Category from '@/models/Category';
import { Type as TransactionType } from '@/models/Transaction';

interface CategoryTypeaheadProps extends Omit<TypeaheadV2Props<Category>, 'options' | 'valueField' | 'labelField' | 'groupBy' | 'renderElement'> {
  className?: string;
  type?: TransactionType;
}

const CategoryTypeahead = forwardRef<HTMLInputElement, CategoryTypeaheadProps>(({
                                                                                  multiple = false,
                                                                                  value,
                                                                                  onChange,
                                                                                  className,
                                                                                  type,
                                                                                  ...props
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
    <TypeaheadV2<Category>
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
      {...props}
    ></TypeaheadV2>
  );
});

CategoryTypeahead.displayName = 'CategoryTypeahead';

export default CategoryTypeahead;
