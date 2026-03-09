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

    // File-explorer sort: folders (has children) before leaves, then lexicographic within each level.
    // Preserves parent→child ordering by sorting the full path segment-by-segment.
    const sortedOptions = useMemo(() => {
      return options.slice().sort((a, b) => {
        const aPath = a.getFullPath();
        const bPath = b.getFullPath();
        const len = Math.min(aPath.length, bPath.length);
        for (let i = 0; i < len; i++) {
          const cmp = aPath[i].localeCompare(bPath[i]);
          if (cmp !== 0) return cmp;
        }
        // Same prefix: folder (has children) before leaf
        if (aPath.length !== bPath.length) {
          const aIsFolder = a.children.length > 0;
          const bIsFolder = b.children.length > 0;
          if (aIsFolder && !bIsFolder) return -1;
          if (!aIsFolder && bIsFolder) return 1;
        }
        return aPath.length - bPath.length;
      });
    }, [options]);

    const renderElement = useCallback<TypeaheadV2Props<Category, string>['renderElement']>(
      (el, _vf, _lf, { isFiltered }): ReactNode => {
        const depth = el.depth;
        if (isFiltered) {
          return (
            <div className="flex flex-col min-w-0 w-full">
              <span className="truncate text-sm">{el.name}</span>
              {depth > 0 && (
                <span className="truncate text-xs text-muted-foreground">
                  {el.getFullPath().slice(0, -1).join(' › ')}
                </span>
              )}
            </div>
          );
        }
        return (
          <div className="flex items-center w-full min-w-0" style={{ paddingLeft: Math.min(depth, 3) * 14 }}>
            <div className="flex items-center gap-1.5 min-w-0">
              {depth > 0 && (
                <span className="shrink-0 text-muted-foreground/50 select-none" aria-hidden="true">└</span>
              )}
              <span className="truncate">{el.name}</span>
            </div>
          </div>
        );
      },
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
        hideCheckmarkColumn={false}
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
