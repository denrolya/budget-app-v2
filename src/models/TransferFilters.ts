import moment, { Moment } from 'moment';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import BaseFilters from '@/models/BaseFilters';
import { readParamArray, readParamMoment, readParamNumberArray, readParamString } from '@/utils/searchParams';

interface TransferFiltersProps {
  searchTerm?: string;
  before?: Moment;
  after?: Moment;
  status?: string;
  amountRange?: number[];
  accounts?: string[];
}

export class TransferFilters extends BaseFilters {
  private readonly _defaults: TransferFiltersProps;

  searchTerm!: string;
  before!: Moment;
  after!: Moment;
  status?: string;
  amountRange!: number[];
  accounts!: string[];

  constructor(initial: TransferFiltersProps = {}) {
    super();

    const filled: TransferFiltersProps = {
      searchTerm: initial.searchTerm ?? '',
      before: initial.before ?? moment().endOf('year'),
      after: initial.after ?? moment().startOf('year'),
      amountRange: initial.amountRange ?? [],
      accounts: initial.accounts ?? [],
      status: initial.status,
    };

    this._defaults = {
      ...filled,
      before: filled.before.clone(),
      after: filled.after.clone(),
    };

    Object.assign(this, filled);
  }

  protected deserialize(key: string, ctx: {
    params: URLSearchParams;
    paramKey: string;
    format: string
  }): unknown | undefined {
    const { params, paramKey } = ctx;
    const format = ctx.format || BACKEND_DATE_FORMAT;

    switch (key) {
      case 'searchTerm':
        return readParamString(params, paramKey) ?? '';
      case 'before':
        return readParamMoment(params, paramKey, format) ?? undefined;
      case 'after':
        return readParamMoment(params, paramKey, format) ?? undefined;

      case 'accounts':
        return readParamArray(params, paramKey);

      case 'amountRange': {
        const parts = readParamNumberArray(params, paramKey);
        return parts.length ? parts : [];
      }

      case 'status':
        return readParamString(params, paramKey);

      default:
        return undefined;
    }
  }

  reset() {
    Object.assign(this, {
      ...this._defaults,
      before: this._defaults.before.clone(),
      after: this._defaults.after.clone(),
    });
  }

  static isApplicable(key: unknown): key is keyof TransferFilters {
    if (typeof key !== 'string') return false;
    return key in TransferFilters.prototype || key in new TransferFilters();
  }
}

export default TransferFilters;
