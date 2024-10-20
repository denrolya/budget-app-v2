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
    super({
      searchTerm: '',
      before: moment(),
      after: moment().subtract(30, 'days'),
      amountRange: [],
      accounts: [],
      ...props
    });
  }

  static isApplicable(key: unknown): key is keyof TransferFilters {
    if (typeof key !== 'string') {
      return false;
    }
    return key in TransferFilters.prototype || key in new TransferFilters();
  }
}

export default TransferFilters;
