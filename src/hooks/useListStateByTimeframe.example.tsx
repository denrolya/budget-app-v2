import moment, { Moment } from 'moment';
import { useCallback, useMemo } from 'react';

import { FilterModel } from '@/models/BaseFilters';
import { Sorting } from '@/types/pagination';

import { useListState, UseListReturn } from './useListState';

interface UseListStateByTimeframeOptions<FilterType extends FilterModel, DataType> {
  initialFilters: FilterType;
  initialSort?: Sorting;
  queryKeyBase?: string;
  updateUrl?: boolean;
  searchParamKeys?: {
    [K in keyof FilterType]?: string;
  };
  initialStart: Moment;
  periodSize: moment.DurationInputArg1;
  periodUnit: moment.unitOfTime.DurationConstructor;
  queryFn: (start: Moment, end: Moment, filters: FilterType, sort: Sorting) => Promise<DataType>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  select?: <TSelected = unknown>(data: DataType) => TSelected;
  additionalFetchDependencies?: unknown[];
  fieldNames?: {
    after?: keyof FilterType;
    before?: keyof FilterType;
  };
}

export const useListStateByTimeframeExample = <
  FilterType extends FilterModel,
  DataType extends { totalItems: number },
>({
  periodSize,
  periodUnit,
  queryFn,
  fieldNames = { after: 'after', before: 'before' },
  ...baseOptions
}: UseListStateByTimeframeOptions<FilterType, DataType>): UseListReturn<FilterType, DataType> & {
  timeframeStart: Moment;
  timeframeEnd: Moment;
} => {
  const list = useListState<FilterType, DataType, any>({
    ...baseOptions,
    queryFn: (page, _perPage, filters, sort) => {
      const timeframeStart = moment(filters.after).add((page - 1) * periodSize, periodUnit);
      const timeframeEnd = moment(filters.before).add(periodSize, periodUnit).subtract(1, 'second');

      const updatedFilters = new (filters.constructor as { new (): FilterType })();
      Object.assign(updatedFilters, filters);
      updatedFilters.setFilter(fieldNames.after, timeframeStart);
      updatedFilters.setFilter(fieldNames.before, timeframeEnd);

      return queryFn(timeframeStart, timeframeEnd, updatedFilters, sort);
    },
    initialPerPage: 1,
  });

  return list;
};
