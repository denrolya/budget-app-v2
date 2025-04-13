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

  constructor(initial: TransferFiltersProps = {}) {
    super();

    // Fill missing fields with fallbacks
    const filled: TransferFiltersProps = {
      searchTerm: initial.searchTerm ?? '',
      before: initial.before ?? moment().endOf('year'),
      after: initial.after ?? moment().startOf('year'),
      amountRange: initial.amountRange ?? [],
      accounts: initial.accounts ?? [],
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

  static isApplicable(key: unknown): key is keyof TransferFilters {
    if (typeof key !== 'string') {
      return false;
    }
    return key in TransferFilters.prototype || key in new TransferFilters();
  }
}

export default TransferFilters;
