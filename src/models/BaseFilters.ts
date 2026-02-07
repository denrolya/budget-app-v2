import isEqual from 'lodash/isEqual';
import moment from 'moment';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';

export interface FilterConstructor<T extends BaseFilters = BaseFilters> {
  new(): T;

  fromSearchParams(params: URLSearchParams, map: Record<string, string>, format: string): T;
}

export interface FilterModel {
  reset(): void;

  setFilter<K extends keyof this>(key: K, value: this[K]): this;
}

type DeserializeCtx = {
  params: URLSearchParams;
  paramKey: string;
  format: string;
};

abstract class BaseFilters implements FilterModel {
  [key: string]: any;

  /**
   * Override in subclasses to parse specific keys from URLSearchParams.
   * Must return `undefined` if param is not present.
   */

  protected deserialize(_key: string, ctx: DeserializeCtx): unknown | undefined {
    // Default behavior: read as string (no guessing)
    const raw = ctx.params.get(ctx.paramKey);
    return raw === null ? undefined : raw;
  }

  static fromSearchParams<T extends BaseFilters>(
    this: new () => T,
    params: URLSearchParams,
    map: Record<string, string> = {},
    format = BACKEND_DATE_FORMAT,
  ): T {
    let instance = new this();

    Object.keys(instance)
      .filter((k) => k[0] !== '_')
      .forEach((key) => {
        const paramKey = map[key] || key;

        // Let subclass decide how to read/parse; undefined means "not present"
        const parsed = instance.deserialize(key, { params, paramKey, format });
        if (parsed !== undefined) {
          instance = instance.setFilter(key as keyof T, parsed as any);
        }
      });

    return instance;
  }

  protected constructor(filters: Record<string, any> = {}) {
    Object.assign(this, filters);
  }

  setFilter<K extends keyof this>(key: K, value: this[K]): this {
    const clone = this.clone();
    clone[key] = value;
    return clone;
  }

  reset() {
    Object.assign(this, this._defaults);
  }

  get activeCount(): number {
    let count = 0;

    const keys = Object.keys(this._defaults);
    for (const key of keys) {
      const current = this[key];
      const original = this._defaults[key];

      if (moment.isMoment(current) && moment.isMoment(original)) {
        if (!current.isSame(original, 'day')) count++;
        continue;
      }

      if (!isEqual(current, original)) count++;
    }

    return count;
  }

  static isApplicable(key: string): boolean {
    return key in this.prototype;
  }

  clone(): this {
    const clone = new (this.constructor as { new(): this })();
    Object.assign(clone, this);
    return clone;
  }
}

export default BaseFilters;
