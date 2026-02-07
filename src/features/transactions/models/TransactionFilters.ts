import moment, { Moment } from 'moment';

import BaseFilters from '@/models/BaseFilters';
import { Type as TransactionType } from '@/features/transactions';

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
  currencies?: string[];
}

type Scalar = string | number | boolean | null | undefined;
type ScalarOrArray<T extends Scalar = Scalar> = T | T[];

const isMomentLike = (v: unknown): v is Moment => moment.isMoment(v);

const toStringArray = (value: ScalarOrArray): string[] => {
  if (value === null || value === undefined) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);
};

const toNumberArray = (value: ScalarOrArray): number[] => {
  if (value === null || value === undefined) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .map((v) => (typeof v === 'number' ? v : Number(String(v).trim())))
    .filter((n) => Number.isFinite(n));
};

const toMixedIdArray = (value: ScalarOrArray): Array<string | number> => {
  if (value === null || value === undefined) return [];
  const arr = Array.isArray(value) ? value : [value];

  return arr
    .map((v) => {
      // Keep numbers as numbers
      if (typeof v === 'number' && Number.isFinite(v)) return v;

      const s = String(v).trim();
      if (!s) return null;

      // If clean numeric, convert (helps when backend expects numeric IDs)
      const n = Number(s);
      if (Number.isFinite(n) && s === String(n)) return n;

      return s;
    })
    .filter((v): v is string | number => v !== null);
};

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
  currencies!: string[];

  constructor(initial: TransactionFiltersProps = {}) {
    super();

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
      currencies: initial.currencies ?? [],
    };

    this._defaults = {
      ...filled,
      before: filled.before.clone(),
      after: filled.after.clone(),
      // ensure arrays are cloned by value
      amountRange: [...(filled.amountRange ?? [])],
      categories: [...(filled.categories ?? [])],
      excludedCategories: [...(filled.excludedCategories ?? [])],
      accounts: [...(filled.accounts ?? [])],
      currencies: [...(filled.currencies ?? [])],
    };

    Object.assign(this, filled);

    // Enforce normalization even for constructor input
    this.accounts = toStringArray(this.accounts);
    this.amountRange = toNumberArray(this.amountRange);
    this.categories = toMixedIdArray(this.categories);
    this.excludedCategories = toMixedIdArray(this.excludedCategories);
    this.currencies = toStringArray(this.currencies);
  }

  /**
   * Hard normalization to make URL hydration refresh-safe.
   * This is the critical part that prevents "forEach is not a function".
   */
  override setFilter<K extends keyof this>(key: K, value: this[K]): this {
    const normalized = this.normalize(key as string, value);
    return super.setFilter(key, normalized as this[K]);
  }

  private normalize(key: string, value: unknown): unknown {
    switch (key) {
      case 'accounts':
        // Always array
        return toStringArray(value as ScalarOrArray);

      case 'amountRange':
        // Always number[]
        return toNumberArray(value as ScalarOrArray);

      case 'categories':
      case 'excludedCategories':
        // Allow string|number IDs; normalize to array
        return toMixedIdArray(value as ScalarOrArray);

      case 'before':
      case 'after': {
        if (isMomentLike(value)) return value;
        // If BaseFilters parsed as string/number, attempt moment coercion
        // (non-strict on purpose — strictness belongs to URL parsing)
        const m = moment(value as any);
        return m.isValid() ? m : (value as any);
      }

      case 'withNestedCategories': {
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        return Boolean(value);
      }

      case 'isDraft': {
        if (value === undefined || value === null || value === '') return undefined;
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        return Boolean(value);
      }

      case 'currencies':
        return toStringArray(value as ScalarOrArray);

      default:
        return value;
    }
  }

  override reset() {
    Object.assign(this, {
      ...this._defaults,
      before: this._defaults.before?.clone(),
      after: this._defaults.after?.clone(),
      amountRange: [...(this._defaults.amountRange ?? [])],
      categories: [...(this._defaults.categories ?? [])],
      excludedCategories: [...(this._defaults.excludedCategories ?? [])],
      accounts: [...(this._defaults.accounts ?? [])],
      currencies: [...(this._defaults.currencies ?? [])],
    });
  }

  static isApplicable(key: unknown): key is keyof TransactionFilters {
    if (typeof key !== 'string') return false;
    return key in TransactionFilters.prototype || key in new TransactionFilters();
  }
}

export default TransactionFilters;
