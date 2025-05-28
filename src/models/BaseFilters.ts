import isEqual from 'lodash/isEqual';
import moment from 'moment';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';

export interface FilterConstructor<T extends BaseFilters = BaseFilters> {
  new(): T;

  fromSearchParams(
    params: URLSearchParams,
    map: Record<string, string>,
    format: string,
  ): T;
}

export interface FilterModel {
  reset(): void;

  setFilter<K extends keyof this>(key: K, value: this[K]): this;
}

abstract class BaseFilters implements FilterModel {
  [key: string]: any;

  static fromSearchParams<T extends FilterModel>(
    this: new () => T,
    params: URLSearchParams,
    map: Record<string, string> = {},
    format = BACKEND_DATE_FORMAT,
  ): T {
    let instance = new this();

    Object
      .keys(instance)
      .filter(key => key[0] !== '_')
      .forEach((key) => {
        const paramKey = map[key] || key;
        const rawValue = params.get(paramKey);
        if (rawValue !== null) {
          const isDate = moment(rawValue, format, true).isValid();
          const isArray = rawValue.includes(',');
          const value = isDate
            ? moment(rawValue, format)
            : isArray
              ? rawValue.split(',')
              : rawValue;

          instance = instance.setFilter(key as keyof T, value);
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
