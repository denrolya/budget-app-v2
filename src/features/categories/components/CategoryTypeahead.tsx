import { forwardRef, ReactNode, useCallback, useMemo } from 'react';

import Typeahead, { TypeaheadProps } from '@/components/ui/Typeahead';
import Category from '@/features/categories/models/Category';
import { Type as TransactionType } from '@/features/transactions';
import { useExpenseCategories, useIncomeCategories } from '@/hooks/financeData';

type CategoryTypeaheadProps = Omit<
  TypeaheadProps<Category, string>,
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

    // File-explorer sort: folders before leaves at each path level, then lexicographic.
    // At divergence point i: if a's ancestor at level i is a folder (has items below it) and b's is not,
    // a comes first. An item's ancestor at level i is a "folder" when i < path.length-1 (item is
    // deeper, meaning a descendant exists) or when i === path.length-1 and item itself has children.
    const sortedOptions = useMemo(
      () =>
        options.slice().sort((a, b) => {
          const aPath = a.getFullPath();
          const bPath = b.getFullPath();
          const len = Math.min(aPath.length, bPath.length);
          for (let i = 0; i < len; i++) {
            if (aPath[i] !== bPath[i]) {
              const aAncestorIsFolder = i < aPath.length - 1 || a.children.length > 0;
              const bAncestorIsFolder = i < bPath.length - 1 || b.children.length > 0;
              if (aAncestorIsFolder !== bAncestorIsFolder) return aAncestorIsFolder ? -1 : 1;
              return aPath[i].localeCompare(bPath[i]);
            }
          }
          // One path is a prefix of the other — parent (shorter) before child (longer)
          return aPath.length - bPath.length;
        }),
      [options],
    );

    const renderElement = useCallback<TypeaheadProps<Category, string>['renderElement']>(
      (el, _vf, _lf, { isFiltered }): ReactNode => {
        const depth = el.depth;
        if (isFiltered) {
          return (
            <div className="flex flex-col">
              <span className="whitespace-nowrap text-sm">{el.name}</span>
              {depth > 0 && (
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {el.getFullPath().slice(0, -1).join(' › ')}
                </span>
              )}
            </div>
          );
        }
        return (
          <div style={{ paddingLeft: Math.min(depth, 3) * 14 }} className="flex items-center">
            <div className="flex items-center gap-1.5">
              {depth > 0 && (
                <span aria-hidden="true" className="shrink-0 text-muted-foreground/50 select-none">
                  └
                </span>
              )}
              <span className="whitespace-nowrap">{el.name}</span>
            </div>
          </div>
        );
      },
      [],
    );

    const filterFn: TypeaheadProps<Category, string>['filterFn'] = (option, input) => {
      const q = input.trim().toLowerCase();
      if (!q) return true;

      const name = option.name.toLowerCase();
      const parentName = (option.parent?.name ?? '').toLowerCase();
      const rootName = (option.root?.name ?? '').toLowerCase();
      const path = option.getFullPath().join(' > ').toLowerCase();

      return name.includes(q) || parentName.includes(q) || rootName.includes(q) || path.includes(q);
    };

    return (
      <Typeahead<Category, string>
        filterFn={filterFn}
        groupBy="type"
        hideCheckmarkColumn={false}
        labelField="name"
        multiple={multiple}
        options={sortedOptions}
        placeholder={multiple ? 'Select categories…' : 'Select a category…'}
        renderElement={renderElement}
        value={value}
        valueField="id"
        className={className}
        dropdownClassName="max-w-[480px]"
        onChange={onChange}
        ref={ref}
        {...props}
      />
    );
  },
);

CategoryTypeahead.displayName = 'CategoryTypeahead';

export default CategoryTypeahead;
