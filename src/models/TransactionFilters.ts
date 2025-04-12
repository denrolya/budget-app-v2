import moment, { Moment } from 'moment';
import isEqual from 'lodash/isEqual';

import { Type as TransactionType } from '@/types/transaction';
import BaseFilters from '@/models/BaseFilters';

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
  private _defaults: TransactionFiltersProps;

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

    // Store original values as "defaults"
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

  getModifiedCount(): number {
    let count = 0;

    const keys = Object.keys(this._defaults) as (keyof TransactionFiltersProps)[];
    for (const key of keys) {
      const current = this[key];
      const original = this._defaults[key];

      if (moment.isMoment(current) && moment.isMoment(original)) {
        if (!current.isSame(original, 'day')) count++;
        continue;
      }

      if (!isEqual(current, original)) count++;
    }

    return count;
  }

  static isApplicable(key: unknown): key is keyof TransactionFilters {
    if (typeof key !== 'string') {
      return false;
    }
    return key in TransactionFilters.prototype || key in new TransactionFilters();
  }
}

export default TransactionFilters;
