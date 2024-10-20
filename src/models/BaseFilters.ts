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

  static isApplicable(key: string): boolean {
    return key in this.prototype;
  }
}

export default BaseFilters;
