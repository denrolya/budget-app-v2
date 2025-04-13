import isEqual from 'lodash/isEqual';
import moment from 'moment/moment';

import { FilterModel } from '@/hooks/useListState';

abstract class BaseFilters implements FilterModel {
  [key: string]: any;

  protected constructor(filters: Record<string, any> = {}) {
    Object.assign(this, filters);
  }

  setFilter<K extends keyof this>(key: K, value: this[K]): void {
    if (key in this) {
      this[key] = value;
    }
  }

  reset() {
    Object.assign(this, this._defaults);
  }

  getModifiedCount(): number {
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
}

export default BaseFilters;
