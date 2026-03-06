import moment, { Moment } from 'moment';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import BaseFilters from '@/models/BaseFilters';
import { readParamArray, readParamMoment, readParamNumberArray, readParamString } from '@/lib/url/searchParams';

type Scalar = string | number | boolean | null | undefined;
type ScalarOrArray<T extends Scalar = Scalar> = T | T[];

/** Positional: preserves NaN sentinel so [NaN, 500] = "no min, max 500". */
const toAmountRange = (value: ScalarOrArray): number[] => {
  if (value === null || value === undefined) return [];
  const arr = Array.isArray(value) ? value : [value];
  if (arr.length === 0) return [];
  const mapped = arr.map((v) => {
    if (v === null || v === undefined) return NaN;
    return typeof v === 'number' ? v : Number(String(v).trim());
  });
  if (mapped.every((n) => !Number.isFinite(n))) return [];
  return mapped;
};

interface TransferFiltersProps {
  searchTerm?: string;
  before?: Moment;
  after?: Moment;
  amountRange?: number[];
  accounts?: string[];
  currencies?: string[];
}

export class TransferFilters extends BaseFilters {
  private readonly _defaults: TransferFiltersProps;

  searchTerm!: string;
  before!: Moment;
  after!: Moment;
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
      currencies: initial.currencies ?? [],
    };

    this._defaults = {
      ...filled,
      before: filled.before.clone(),
      after: filled.after.clone(),
      currencies: [...(filled.currencies ?? [])],
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
        const raw = params.get(paramKey);
        if (!raw) return [];
        const [minStr, maxStr] = raw.split(',').map((s) => s.trim());
        const min = minStr ? Number(minStr) : NaN;
        const max = maxStr !== undefined ? (maxStr ? Number(maxStr) : NaN) : NaN;
        const result = [min, max];
        return result.every((n) => !Number.isFinite(n)) ? [] : result;
      }

      case 'currencies':
        return readParamArray(params, paramKey);

      default:
        return undefined;
    }
  }

  override setFilter<K extends keyof this>(key: K, value: this[K]): this {
    if (key === 'amountRange') {
      return super.setFilter(key, toAmountRange(value as ScalarOrArray) as this[K]);
    }
    return super.setFilter(key, value);
  }

  reset() {
    Object.assign(this, {
      ...this._defaults,
      before: this._defaults.before.clone(),
      after: this._defaults.after.clone(),
      currencies: [...(this._defaults.currencies ?? [])],
    });
  }

  static isApplicable(key: unknown): key is keyof TransferFilters {
    if (typeof key !== 'string') return false;
    return key in TransferFilters.prototype || key in new TransferFilters();
  }
}

export default TransferFilters;
