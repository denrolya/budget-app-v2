import moment, { Moment } from 'moment';

import { FilterModel } from '@/hooks/useListState';

interface TransferFiltersProps {
  searchTerm?: string;
  before?: Moment;
  after?: Moment;
  status?: string;
  amountRange?: number[];
  accounts?: string[];
}

export class TransferFilters implements FilterModel {
  searchTerm: string;
  before: Moment;
  after: Moment;
  amountRange: number[];
  accounts: string[];

  constructor({
                searchTerm = '',
                before = moment(),
                after = moment().subtract(30, 'days'),
                amountRange = [],
                accounts = [],
              }: TransferFiltersProps = {}) {
    this.searchTerm = searchTerm;
    this.before = before;
    this.after = after;
    this.amountRange = amountRange;
    this.accounts = accounts;
  }

  setFilter<K extends keyof this>(key: K, value: this[K]): void {
    if (key in this) {
      (this as any)[key] = value;
    }
  }
}
