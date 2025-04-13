import { useQuery, UseQueryResult } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Sorting } from '@/types/pagination';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';

export interface FilterModel {
  setFilter<K extends keyof this>(key: K, value: this[K]): void;
}

export interface PaginationState {
  currentPage: number;
  perPage: number;
}

export interface UseListState<FilterType> {
  pagination: PaginationState;
  filters: FilterType;
  sort: Sorting;
}

type SetFilterFunction<T> = <K extends keyof T>(key: K, value: T[K]) => void;

interface UseListStateOptions<FilterType extends FilterModel, DataType> {
  initialPerPage?: number;
  initialFilters: FilterType;
  initialSort?: Sorting;
  searchParamKeys?: {
    [K in keyof FilterType]?: string;
  };
  formatMoment?: string;
  updateUrl?: boolean;
  queryFn: (page: number, perPage: number, filters: FilterType, sort: Sorting) => Promise<DataType>;
  queryKeyBase?: string;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  select?: <TSelected = unknown>(data: DataType) => TSelected;
  additionalFetchDependencies?: unknown[];
}

export type UseListReturn<FilterType, DataType> = Omit<UseListState<FilterType>, 'pagination'> &
  UseQueryResult<DataType, Error> & {
    pagination: {
      totalItems: number;
      totalPages: number;
      perPage: number;
      currentPage: number;
      setCurrentPage: (page: number) => void;
      setPerPage: (perPage: number) => void;
    };
    setFilter: SetFilterFunction<FilterType>;
    resetFilters: () => void;
    setSort: (sort: Sorting) => void;
  };

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_GC_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * TODO: Split into { pagination, filters, sort } with methods inside
 */
export const useListState = <FilterType extends FilterModel, DataType extends { totalItems: number }, ItemType>({
  enabled = true,
  initialPerPage = 20,
  initialFilters,
  initialSort,
  searchParamKeys = {},
  formatMoment = BACKEND_DATE_FORMAT,
  updateUrl = true,
  queryFn,
  queryKeyBase,
  staleTime = DEFAULT_STALE_TIME,
  gcTime = DEFAULT_GC_TIME,
  select,
  additionalFetchDependencies = [],
}: UseListStateOptions<FilterType, DataType>): UseListReturn<FilterType, DataType> => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialState = useCallback(
    (): UseListState<FilterType> => ({
      pagination: {
        currentPage: parseInt(searchParams.get('page') || '1', 10),
        perPage: parseInt(searchParams.get('perPage') || initialPerPage.toString(), 10),
      },
      filters: initialFilters,
      sort: {
        field: (searchParams.get('sortField') as keyof ItemType) || initialSort?.field,
        direction: (searchParams.get('sortDirection') as 'asc' | 'desc') || initialSort?.direction,
      },
    }),
    [searchParams, initialPerPage, initialFilters, initialSort],
  );

  const [state, setState] = useState<UseListState<FilterType>>(getInitialState);

  const prevStateRef = useRef(state);

  const setCurrentPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: page },
    }));
  }, []);

  const setPerPage = useCallback((perPage: number) => {
    setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, totalPages: 0, currentPage: 1, perPage: perPage },
    }));
  }, []);

  const setFilter: SetFilterFunction<FilterType> = useCallback((key, value) => {
    setState((prev) => {
      const updatedFilters = new (prev.filters.constructor as { new (): FilterType })();
      Object.assign(updatedFilters, prev.filters);
      updatedFilters.setFilter(key, value);

      return {
        ...prev,
        pagination: { ...prev.pagination, currentPage: 1 },
        filters: updatedFilters,
      };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: initialFilters,
      pagination: { ...prev.pagination, currentPage: 1 },
    }));
  }, [initialFilters]);

  const setSort = useCallback(({ field, direction }: Sorting) => {
    setState((prev) => ({
      ...prev,
      sort: { field, direction },
    }));
  }, []);

  const updateSearchParamsDebounced = useMemo(
    () =>
      debounce((params: URLSearchParams) => {
        if (updateUrl) {
          for (const [key, value] of params.entries()) {
            if (!value) {
              params.delete(key);
            }
          }
          setSearchParams(params);
        }
      }, 300),
    [setSearchParams, updateUrl],
  );

  useEffect(() => {
    if (!updateUrl) return;

    const hasStateChanged = !isEqual(
      {
        pagination: state.pagination,
        filters: state.filters,
        sort: state.sort,
      },
      {
        pagination: prevStateRef.current.pagination,
        filters: prevStateRef.current.filters,
        sort: prevStateRef.current.sort,
      },
    );

    if (!hasStateChanged) return;

    const params = new URLSearchParams();
    params.set('page', state.pagination.currentPage.toString());
    params.set('perPage', state.pagination.perPage.toString());

    Object.entries(state.filters).forEach(([key, value]) => {
      const searchParamKey = searchParamKeys[key as keyof FilterType] || key;
      const defaultValue = initialFilters[key as keyof FilterType];
      if (value !== undefined && value !== null && value !== '' && !isEqual(value, defaultValue)) {
        const formattedValue = moment.isMoment(value) ? value.format(formatMoment) : value.toString();
        params.set(searchParamKey, formattedValue);
      }
    });

    if (state.sort.field && state.sort.direction) {
      params.set('sortField', state.sort.field.toString());
      params.set('sortDirection', state.sort.direction);
    }

    updateSearchParamsDebounced(params);
    prevStateRef.current = state;

    return () => {
      updateSearchParamsDebounced.cancel();
    };
  }, [state, prevStateRef, searchParamKeys, formatMoment, updateSearchParamsDebounced, updateUrl, initialFilters]);

  const queryKey = [
    queryKeyBase,
    state.pagination.currentPage,
    state.pagination.perPage,
    state.filters,
    state.sort,
    ...additionalFetchDependencies,
  ];

  const response = useQuery<DataType, Error>({
    enabled,
    select,
    queryKey,
    queryFn: (() =>
      queryFn(
        state.pagination.currentPage,
        state.pagination.perPage,
        state.filters,
        state.sort,
      )) as () => Promise<DataType>,
    staleTime,
    gcTime,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
  });

  return {
    setFilter,
    resetFilters,
    setSort,
    ...state,
    pagination: {
      ...state.pagination,
      totalItems: response.data?.totalItems || 0,
      totalPages: Math.ceil(response.data?.totalItems || 0 / state.pagination.perPage),
      setCurrentPage,
      setPerPage,
    },
    ...response,
  };
};
