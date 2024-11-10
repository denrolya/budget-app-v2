import moment, { Moment } from 'moment';

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

  constructor(props: TransactionFiltersProps = {}) {
    super();

    this.searchTerm = props.searchTerm ?? '';
    this.before = props.before ?? moment();
    this.after = props.after ?? moment().subtract(30, 'days');
    this.amountRange = props.amountRange ?? [];
    this.categories = props.categories ?? [];
    this.excludedCategories = props.excludedCategories ?? [];
    this.accounts = props.accounts ?? [];
    this.withNestedCategories = props.withNestedCategories ?? false;
    this.isDraft = props.isDraft ?? undefined;
    this.type = props.type ?? undefined;
  }

  static isApplicable(key: unknown): key is keyof TransactionFilters {
    if (typeof key !== 'string') {
      return false;
    }
    return key in TransactionFilters.prototype || key in new TransactionFilters();
  }
}

export default TransactionFilters;
