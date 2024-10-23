import moment, { Moment } from 'moment';

import BaseFilters from '@/models/BaseFilters';

interface TransferFiltersProps {
  searchTerm?: string;
  before?: Moment;
  after?: Moment;
  status?: string;
  amountRange?: number[];
  accounts?: string[];
}

export class TransferFilters extends BaseFilters {
  searchTerm!: string;
  before!: Moment;
  after!: Moment;
  status?: string;
  amountRange!: number[];
  accounts!: string[];

  constructor(props: TransferFiltersProps = {}) {
    super();

    this.searchTerm = props.searchTerm ?? '';
    this.before = props.before ?? moment();
    this.after = props.after ?? moment().subtract(30, 'days');
    this.amountRange = props.amountRange ?? [];
    this.accounts = props.accounts ?? [];
  }

  static isApplicable(key: unknown): key is keyof TransferFilters {
    if (typeof key !== 'string') {
      return false;
    }
    return key in TransferFilters.prototype || key in new TransferFilters();
  }
}

export default TransferFilters;
