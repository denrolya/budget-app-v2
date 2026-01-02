import React, { ReactNode, useMemo } from 'react';

import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import { useExpenseCategories, useIncomeCategories } from '@/contexts/FinanceData';
import Category from '@/models/Category';
import { Type as TransactionType } from '@/types/transaction';

type CategoryTypeaheadProps = Omit<
  TypeaheadV2Props<Category, string>,
  'options' | 'labelField' | 'groupBy' | 'renderElement'
> & {
  className?: string;
  type?: TransactionType;
};

const CategoryTypeahead: React.FC<CategoryTypeaheadProps> = ({
                                                               multiple = false,
                                                               value,
                                                               onChange,
                                                               className,
                                                               type,
                                                               ...props
                                                             }) => {
  const incomeCategories = useIncomeCategories();
  const expenseCategories = useExpenseCategories();

  const options = useMemo(() => {
    if (type === TransactionType.Income) return incomeCategories;
    if (type === TransactionType.Expense) return expenseCategories;
    return incomeCategories.concat(expenseCategories);
  }, [expenseCategories, incomeCategories, type]);

  const sortedOptions = useMemo(() => options
    .slice()
    .sort((a, b) => a.getFullPath().join(' > ').localeCompare(b.getFullPath().join(' > '))), [options]);

  const renderElement: TypeaheadV2Props<Category, string>['renderElement'] = (el): ReactNode => (
    <>
      <div className="flex flex-col">
        <span>{el.name}</span>
        <span className="text-xs text-muted-foreground">{el.getFullPath().join(' > ')}</span>
      </div>
      <div className="ml-auto flex items-center space-x-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: el.color }}></span>
        <span className="text-xs font-medium">{el.type}</span>
      </div>
    </>
  );

  const filterFn: TypeaheadV2Props<Category, string>['filterFn'] = (option, input) => {
    const q = input.trim().toLowerCase();
    if (!q) return true;

    const name = option.name.toLowerCase();
    const parentName = (option.parent?.name ?? '').toLowerCase();
    const rootName = (option.root?.name ?? '').toLowerCase();
    const path = option.getFullPath().join(' > ').toLowerCase();

    return (
      name.includes(q) ||
      parentName.includes(q) ||
      rootName.includes(q) ||
      path.includes(q)
    );
  };

  return (
    <TypeaheadV2<Category, string>
      labelField="name"
      groupBy="type"
      valueField="id"
      placeholder={multiple ? 'Select categories…' : 'Select a category…'}
      multiple={multiple}
      options={sortedOptions}
      renderElement={renderElement}
      value={value}
      onChange={onChange}
      className={className}
      filterFn={filterFn}
      {...props}
    />
  );
};

CategoryTypeahead.displayName = 'CategoryTypeahead';

export default CategoryTypeahead;
