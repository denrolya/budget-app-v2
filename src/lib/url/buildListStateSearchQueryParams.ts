import isNil from 'lodash/isNil';
import moment from 'moment/moment';

import BaseFilters from '@/models/BaseFilters';
import { Sorting } from '@/types/pagination';
import { isSameValue } from '@/lib/isSameValue';

export const buildListStateSearchParams = <FilterType extends BaseFilters>(
  state: {
    pagination: { currentPage: number; perPage: number };
    filters: FilterType;
    sort: Sorting;
  },
  defaults: {
    filters: FilterType;
    initialPerPage: number;
    initialSort?: Sorting;
  },
  keys: Record<string, string>,
  formatMoment: string,
): URLSearchParams => {
  const params = new URLSearchParams();

  if (state.pagination.currentPage !== 1) {
    params.set('page', state.pagination.currentPage.toString());
  }

  if (state.pagination.perPage !== defaults.initialPerPage) {
    params.set('perPage', state.pagination.perPage.toString());
  }

  Object.entries(state.filters).forEach(([key, value]) => {
    if (key === '_defaults') return;
    const paramKey = keys[key as string] || key;
    const defaultValue = defaults.filters[key as keyof FilterType];
    if (!isNil(value) && value !== '' && !isSameValue(value, defaultValue)) {
      let formattedValue: string;
      if (moment.isMoment(value)) {
        formattedValue = value.format(formatMoment);
      } else if (Array.isArray(value)) {
        // Preserve positional semantics: NaN → empty string so [NaN, 500] → ",500"
        formattedValue = value.map((v) => (typeof v === 'number' && !Number.isFinite(v) ? '' : String(v))).join(',');
      } else {
        formattedValue = value.toString();
      }
      if (formattedValue) params.set(paramKey, formattedValue);
    }
  });

  const { sort } = state;
  if (
    sort.field &&
    sort.direction &&
    (!defaults.initialSort ||
      sort.field !== defaults.initialSort.field ||
      sort.direction !== defaults.initialSort.direction)
  ) {
    params.set('sortField', sort.field.toString());
    params.set('sortDirection', sort.direction);
  }

  return params;
};
