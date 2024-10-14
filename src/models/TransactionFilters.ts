import moment, { Moment } from 'moment';

import { FilterModel } from '@/hooks/useListState';

interface TransactionFiltersProps {
  searchTerm?: string;
  before?: Moment;
  after?: Moment;
  amountRange?: number[];
  categories?: string[] | number[];
  excludedCategories?: string[] | number[];
  accounts?: string[];
  withNestedCategories?: boolean;
  isDraft?: boolean;
}

export class TransactionFilters implements FilterModel {
  searchTerm: string;
  before: Moment;
  after: Moment;
  amountRange: number[];
  categories: number[] | string[];
  excludedCategories: number[] | string[];
  accounts: number[] | string[];
  withNestedCategories: boolean;
  isDraft?: boolean;

  constructor({
                searchTerm = '',
                before = moment(),
                after = moment().subtract(30, 'days'),
                amountRange = [],
                categories = [],
                excludedCategories = [],
                accounts = [],
                withNestedCategories = false,
                isDraft = undefined,
              }: TransactionFiltersProps = {}) {
    this.searchTerm = searchTerm;
    this.before = before;
    this.after = after;
    this.amountRange = amountRange;
    this.categories = categories;
    this.excludedCategories = excludedCategories;
    this.accounts = accounts;
    this.withNestedCategories = withNestedCategories;
    this.isDraft = isDraft;
  }

  setFilter<K extends keyof this>(key: K, value: this[K]): void {
    if (key in this) {
      (this as any)[key] = value;
    }
  }
}
