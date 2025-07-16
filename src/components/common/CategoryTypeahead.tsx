// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react';

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
  valueField = 'id',
  className,
  type,
  ...props
}) => {
  const incomeCategories = useIncomeCategories();
  const expenseCategories = useExpenseCategories();

  const renderElement: TypeaheadV2Props<Category, string>['renderElement'] = (el) => (
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

  let options = incomeCategories.concat(expenseCategories);
  if (type === TransactionType.Income) {
    options = incomeCategories;
  } else if (type === TransactionType.Expense) {
    options = expenseCategories;
  }

  const sortedOptions = options
    .slice()
    .sort((a, b) => a.getFullPath().join(' > ').localeCompare(b.getFullPath().join(' > ')));

  const filterFn: TypeaheadV2Props<Category, string>['filterFn'] = (option, input) => {
    const normalizedInput = input.toLowerCase();
    return (
      option.name.toLowerCase().includes(normalizedInput) ||
      option.parent?.name?.toLowerCase().includes(normalizedInput) ||
      option.root?.name?.toLowerCase().includes(normalizedInput)
    );
  };

  return (
    <TypeaheadV2<Category, number>
      labelField="name"
      valueField={valueField as keyof Category}
      groupBy={type as TransactionType}
      placeholder={multiple ? 'Select categories...' : 'Select a category...'}
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
