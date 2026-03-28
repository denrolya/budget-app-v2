import moment, { type Moment } from 'moment';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { type Type as TransactionType } from '@/features/transactions';
import {
  readParamAmountRange,
  readParamArray,
  readParamBool,
  readParamMoment,
  readParamString,
  type ScalarOrArray,
  toAmountRange,
} from '@/lib/url/searchParams';
import BaseFilters from '@/models/BaseFilters';

interface TransactionFiltersProps {
  searchTerm?: string;
  before?: Moment;
  after?: Moment;
  amountRange?: number[];
  categories?: string[] | number[];
  excludedCategories?: string[] | number[];
  debts?: string[] | number[];
  accounts?: string[];
  withNestedCategories?: boolean;
  isDraft?: boolean;
  type?: TransactionType;
  currencies?: string[];
}

const isMomentLike = (v: unknown): v is Moment => moment.isMoment(v);

const toStringArray = (value: ScalarOrArray): string[] => {
  if (value === null || value === undefined) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.map((v) => String(v).trim()).filter((v) => v.length > 0);
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
  debts!: number[] | string[];
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
      debts: initial.debts ?? [],
      accounts: initial.accounts ?? [],
      withNestedCategories: initial.withNestedCategories ?? false,
      isDraft: initial.isDraft,
      type: initial.type,
      currencies: initial.currencies ?? [],
    };

    this._defaults = {
      ...filled,
      before: filled.before!.clone(),
      after: filled.after!.clone(),
      // ensure arrays are cloned by value
      amountRange: [...(filled.amountRange ?? [])],
      categories: [...(filled.categories ?? [])] as string[] | number[],
      excludedCategories: [...(filled.excludedCategories ?? [])] as string[] | number[],
      debts: [...(filled.debts ?? [])] as string[] | number[],
      accounts: [...(filled.accounts ?? [])],
      currencies: [...(filled.currencies ?? [])],
    };

    Object.assign(this, filled);

    // Enforce normalization even for constructor input
    this.accounts = toStringArray(this.accounts);
    this.amountRange = toAmountRange(this.amountRange);
    this.categories = toMixedIdArray(this.categories) as string[] | number[];
    this.excludedCategories = toMixedIdArray(this.excludedCategories) as string[] | number[];
    this.debts = toMixedIdArray(this.debts) as string[] | number[];
    this.currencies = toStringArray(this.currencies);
  }

  protected override deserialize(
    key: string,
    ctx: { params: URLSearchParams; paramKey: string; format: string },
  ): unknown | undefined {
    const { params, paramKey, format } = ctx;

    switch (key) {
      case 'after':
      case 'before':
        return readParamMoment(params, paramKey, format);

      case 'categories':
      case 'excludedCategories':
      case 'debts':
      case 'accounts':
      case 'currencies':
        return readParamArray(params, paramKey);

      case 'amountRange':
        return readParamAmountRange(params, paramKey);

      case 'withNestedCategories':
      case 'isDraft':
        return readParamBool(params, paramKey);

      case 'searchTerm':
      case 'type':
      default:
        return readParamString(params, paramKey);
    }
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
        // Positional: NaN = "no value at this position"
        return toAmountRange(value as ScalarOrArray);

      case 'categories':
      case 'excludedCategories':
      case 'debts':
        // Allow string|number IDs; normalize to array
        return toMixedIdArray(value as ScalarOrArray);

      case 'before':
      case 'after': {
        if (isMomentLike(value)) return value;
        // If BaseFilters parsed as string/number, attempt moment coercion
        // (non-strict on purpose — strictness belongs to URL parsing)
        const m = moment(value as string | number | undefined);
        return m.isValid() ? m : value;
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
      debts: [...(this._defaults.debts ?? [])],
      accounts: [...(this._defaults.accounts ?? [])],
      currencies: [...(this._defaults.currencies ?? [])],
    });
  }

  /**
   * Serialize to a flat URL param map — the write-side mirror of `fromSearchParams`.
   * Values are `null` when the filter is empty/default (param should be omitted).
   */
  toUrlParams(paramMap: Record<string, string> = {}): Record<string, string | null> {
    const p = (k: string): string => paramMap[k] ?? k;

    return {
      [p('after')]: this.after.format(BACKEND_DATE_FORMAT),
      [p('before')]: this.before.format(BACKEND_DATE_FORMAT),
      [p('searchTerm')]: this.searchTerm || null,
      [p('categories')]: this.categories?.length ? (this.categories as Array<string | number>).join(',') : null,
      [p('excludedCategories')]: this.excludedCategories?.length
        ? (this.excludedCategories as Array<string | number>).join(',')
        : null,
      [p('debts')]: this.debts?.length ? (this.debts as Array<string | number>).join(',') : null,
      [p('accounts')]: this.accounts?.length ? this.accounts.join(',') : null,
      [p('currencies')]: this.currencies?.length ? this.currencies.join(',') : null,
      [p('amountRange')]: this.amountRange?.length
        ? this.amountRange.map((n) => (Number.isFinite(n) ? String(n) : '')).join(',')
        : null,
      [p('isDraft')]: this.isDraft !== undefined ? String(this.isDraft) : null,
      [p('withNestedCategories')]: this.withNestedCategories ? 'true' : null,
      [p('type')]: this.type ?? null,
    };
  }

  static isApplicable(key: unknown): key is keyof TransactionFilters {
    if (typeof key !== 'string') return false;
    return key in TransactionFilters.prototype || key in new TransactionFilters();
  }
}

export default TransactionFilters;
