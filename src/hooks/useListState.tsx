import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { buildListStateSearchParams, buildQueryKey } from '@/lib/url/buildListStateSearchQueryParams';
import { type Sorting } from '@/types/pagination';
import type BaseFilters from '@/models/BaseFilters';
import { type FilterConstructor } from '@/models/BaseFilters';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';

interface PaginationState {
  currentPage: number;
  perPage: number;
}

type SetFilterFunction<T> = <K extends keyof T>(key: K, value: T[K]) => void;

interface UseListStateOptions<FilterType extends BaseFilters, DataType> {
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
}

export type UseListReturn<FilterType, DataType> = Omit<UseListState<FilterType>, 'pagination' | 'sort'> &
  UseQueryResult<DataType, Error> & {
    pagination: {
      totalItems: number;
      totalPages: number;
      perPage: number;
      currentPage: number;
      setCurrentPage: (page: number) => void;
      setPerPage: (perPage: number) => void;
    };
    sort: {
      field: string;
      direction: 'asc' | 'desc';
      setSort: (sort: Sorting) => void;
    };
    setFilter: SetFilterFunction<FilterType>;
    resetFilters: () => void;
  };

export interface UseListState<FilterType> {
  pagination: PaginationState;
  filters: FilterType;
  sort: Sorting;
}

const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_GC_TIME = 10 * 60 * 1000;

export const useListState = <FilterType extends BaseFilters, DataType extends { totalItems: number }>(
  {
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
  }: UseListStateOptions<FilterType, DataType>,
  additionalFetchDependencies: unknown[] = [],
): UseListReturn<FilterType, DataType> => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasSearchParams = [...searchParams.keys()].length > 0;
  const FilterClass = initialFilters.constructor as FilterConstructor<FilterType>;

  const getInitialState = (): UseListState<FilterType> => {
    // When not managing the URL, always use the provided initialFilters directly.
    // Reading URL params here when updateUrl=false causes two bugs:
    // 1. Stale params from other pages contaminate the query key → stale cached data is served.
    // 2. initialFilters with page-specific values (e.g. accounts/debts filter) get overridden.
    if (!updateUrl) {
      return {
        pagination: { currentPage: 1, perPage: initialPerPage },
        filters: initialFilters,
        sort: {
          field: initialSort?.field || '',
          direction: initialSort?.direction || 'asc',
        },
      };
    }

    return {
      pagination: {
        currentPage: parseInt(searchParams.get('page') || '1', 10),
        perPage: parseInt(searchParams.get('perPage') || initialPerPage.toString(), 10),
      },
      filters:
        hasSearchParams && typeof FilterClass.fromSearchParams === 'function'
          ? (FilterClass.fromSearchParams(
              searchParams,
              searchParamKeys as Record<string, string>,
              formatMoment,
            ) as FilterType)
          : initialFilters,
      sort: {
        field: searchParams.get('sortField') || initialSort?.field || '',
        direction: (searchParams.get('sortDirection') as 'asc' | 'desc') || initialSort?.direction || 'asc',
      },
    };
  };

  const [state, setState] = useState<UseListState<FilterType>>(() => getInitialState());
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
      pagination: { ...prev.pagination, currentPage: 1, perPage },
    }));
  }, []);

  const setFilter: SetFilterFunction<FilterType> = useCallback(
    (key, value) =>
      setState((prev) => ({
        ...prev,
        filters: prev.filters.setFilter(key, value),
        pagination: { ...prev.pagination, currentPage: 1 },
      })),
    [],
  );

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
        if (!updateUrl) return;

        for (const [key, value] of params.entries()) {
          if (!value) params.delete(key);
        }
        setSearchParams(params);
      }, 300),
    [setSearchParams, updateUrl],
  );

  const stateAsParams = useMemo(
    () =>
      buildListStateSearchParams(
        state,
        { filters: initialFilters, initialPerPage, initialSort },
        searchParamKeys as Record<string, string>,
        formatMoment,
      ),
    [state, initialFilters, initialPerPage, initialSort, searchParamKeys, formatMoment],
  );

  useEffect(() => {
    if (!updateUrl) return;

    const hasStateChanged = !isEqual(state, prevStateRef.current);
    if (!hasStateChanged) return;

    updateSearchParamsDebounced(new URLSearchParams(stateAsParams));
    prevStateRef.current = state;

    return () => {
      updateSearchParamsDebounced.cancel();
    };
  }, [state, stateAsParams, updateSearchParamsDebounced, updateUrl]);

  // Build query key from the FULL filter state (not just diff from defaults).
  // stateAsParams only captures values that differ from defaults, so two ledger
  // instances with different initialFilters but the same diff would collide on
  // the same cache key (e.g. account details ledger vs main ledger).
  const queryKeyString = useMemo(
    () => buildQueryKey(state, searchParamKeys as Record<string, string>, formatMoment),
    [state, searchParamKeys, formatMoment],
  );

  const queryKey = useMemo(
    () => [queryKeyBase, queryKeyString, ...additionalFetchDependencies],
    [queryKeyBase, queryKeyString, additionalFetchDependencies],
  );

  const response = useQuery<DataType, Error>({
    enabled,
    select,
    queryKey,
    queryFn: () => queryFn(state.pagination.currentPage, state.pagination.perPage, state.filters, state.sort),
    staleTime,
    gcTime,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
  });

  return {
    pagination: {
      ...state.pagination,
      totalItems: response.data?.totalItems || 0,
      totalPages: Math.ceil((response.data?.totalItems || 0) / state.pagination.perPage),
      setCurrentPage,
      setPerPage,
    },
    sort: {
      ...state.sort,
      setSort,
    },
    filters: state.filters,
    resetFilters,
    setFilter,
    ...response,
  };
};
