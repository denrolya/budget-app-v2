import moment, { Moment } from 'moment';

import BaseFilters from '@/models/BaseFilters';
import { Type as TransactionType } from '@/types/transaction';

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
  type?: TransactionType;
}

export class TransactionFilters extends BaseFilters {
  private readonly _defaults: TransactionFiltersProps;

  searchTerm!: string;
  before!: Moment;
  after!: Moment;
  amountRange!: number[];
  categories!: number[] | string[];
  excludedCategories!: number[] | string[];
  accounts!: string[];
  withNestedCategories!: boolean;
  isDraft?: boolean;
  type?: TransactionType;

  constructor(initial: TransactionFiltersProps = {}) {
    super();

    // Fill missing fields with fallbacks
    const filled: TransactionFiltersProps = {
      searchTerm: initial.searchTerm ?? '',
      before: initial.before ?? moment(),
      after: initial.after ?? moment().subtract(30, 'days'),
      amountRange: initial.amountRange ?? [],
      categories: initial.categories ?? [],
      excludedCategories: initial.excludedCategories ?? [],
      accounts: initial.accounts ?? [],
      withNestedCategories: initial.withNestedCategories ?? false,
      isDraft: initial.isDraft,
      type: initial.type,
    };

    this._defaults = {
      ...filled,
      before: filled.before.clone(),
      after: filled.after.clone(),
    };

    // Assign to current instance
    Object.assign(this, filled);
  }

  reset() {
    Object.assign(this, {
      ...this._defaults,
      before: this._defaults.before.clone(),
      after: this._defaults.after.clone(),
    });
  }

  static isApplicable(key: unknown): key is keyof TransactionFilters {
    if (typeof key !== 'string') {
      return false;
    }
    return key in TransactionFilters.prototype || key in new TransactionFilters();
  }
}

export default TransactionFilters;
