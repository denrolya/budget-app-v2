import moment, { Moment } from 'moment';

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
}

export class TransactionFilters extends BaseFilters {
  searchTerm!: string;
  before!: Moment;
  after!: Moment;
  amountRange!: number[];
  categories!: number[] | string[];
  excludedCategories!: number[] | string[];
  accounts!: string[];
  withNestedCategories!: boolean;
  isDraft?: boolean;

  constructor(props: TransactionFiltersProps = {}) {
    super({
      searchTerm: '',
      before: moment(),
      after: moment().subtract(30, 'days'),
      amountRange: [],
      categories: [],
      excludedCategories: [],
      accounts: [],
      withNestedCategories: false,
      ...props
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
