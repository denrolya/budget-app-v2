import { forwardRef, ReactNode, useCallback, useMemo } from 'react';

import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import Category from '@/features/categories/models/Category';
import { Type as TransactionType } from '@/features/transactions';
import { useExpenseCategories, useIncomeCategories } from '@/hooks/financeData';

type CategoryTypeaheadProps = Omit<
  TypeaheadV2Props<Category, string>,
  'options' | 'labelField' | 'groupBy' | 'renderElement' | 'valueField'
> & {
  className?: string;
  type?: TransactionType;
};

const CategoryTypeahead = forwardRef<HTMLInputElement, CategoryTypeaheadProps>(
  ({ multiple = false, value, onChange, className, type, ...props }, ref) => {
    const incomeCategories = useIncomeCategories();
    const expenseCategories = useExpenseCategories();

    const options = useMemo(() => {
      if (type === TransactionType.Income) return incomeCategories;
      if (type === TransactionType.Expense) return expenseCategories;
      return [...incomeCategories, ...expenseCategories];
    }, [expenseCategories, incomeCategories, type]);

    const sortedOptions = useMemo(
      () => options.slice().sort((a, b) => a.getFullPath().join(' > ').localeCompare(b.getFullPath().join(' > '))),
      [options],
    );

    const renderElement = useCallback<TypeaheadV2Props<Category, string>['renderElement']>(
      (el): ReactNode => (
        <>
          <div className="flex flex-col min-w-0">
            <span className="truncate">{el.name}</span>
            <span className="text-xs text-muted-foreground truncate">{el.getFullPath().join(' > ')}</span>
          </div>

          <div className="ml-auto flex items-center space-x-2 shrink-0">
            <span style={{ backgroundColor: el.color }} className="w-3 h-3 rounded-full" />
            <span className="text-xs font-medium">{el.type}</span>
          </div>
        </>
      ),
      [],
    );

    const filterFn: TypeaheadV2Props<Category, string>['filterFn'] = (option, input) => {
      const q = input.trim().toLowerCase();
      if (!q) return true;

      const name = option.name.toLowerCase();
      const parentName = (option.parent?.name ?? '').toLowerCase();
      const rootName = (option.root?.name ?? '').toLowerCase();
      const path = option.getFullPath().join(' > ').toLowerCase();

      return name.includes(q) || parentName.includes(q) || rootName.includes(q) || path.includes(q);
    };

    return (
      <TypeaheadV2<Category, string>
        filterFn={filterFn}
        groupBy="type"
        labelField="name"
        multiple={multiple}
        options={sortedOptions}
        placeholder={multiple ? 'Select categories…' : 'Select a category…'}
        renderElement={renderElement}
        value={value}
        valueField="id"
        className={className}
        onChange={onChange}
        ref={ref}
        {...props}
      />
    );
  },
);

CategoryTypeahead.displayName = 'CategoryTypeahead';

export default CategoryTypeahead;
