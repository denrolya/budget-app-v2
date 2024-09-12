import debounce from 'lodash.debounce';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Pagination state interface
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

/**
 * Sorting state interface
 * @template T - Type of the items in the list
 */
export interface SortState<T> {
  field: keyof T | null;
  direction: 'asc' | 'desc' | null;
}

/**
 * List state interface
 * @template FilterType - Type of the filters
 * @template ItemType - Type of the items in the list
 */
export interface UseListState<FilterType, ItemType> {
  pagination: PaginationState;
  filters: FilterType;
  sort: SortState<ItemType>;
}

/**
 * Function type for setting filters
 * @template T - Type of the filters
 */
type SetFilterFunction<T> = <K extends keyof T>(key: K, value: T[K]) => void;

/**
 * Options for configuring the useListState hook
 * @template FilterType - Type of the filters
 * @template ItemType - Type of the items in the list
 */
interface UseListStateOptions<FilterType, ItemType> {
  initialPageSize?: number;
  initialFilters: FilterType;
  initialSort?: SortState<ItemType>;
  searchParamKeys?: {
    [K in keyof FilterType]?: string;
  };
}

/**
 * Custom hook to manage list state including pagination, filters, and sorting.
 * It syncs with URL search parameters for state persistence.
 *
 * @template FilterType - Type of the filters
 * @template ItemType - Type of the items in the list
 *
 * @param options - Configuration options for the hook
 * @returns List state and functions to update pagination, filters, and sorting
 */
export const useListState = <FilterType extends Record<string, any>, ItemType>({
                                                                                 initialPageSize = 10,
                                                                                 initialFilters,
                                                                                 initialSort = {
                                                                                   field: null,
                                                                                   direction: null,
                                                                                 },
                                                                                 searchParamKeys = {},
                                                                               }: UseListStateOptions<FilterType, ItemType>) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialState = (): UseListState<FilterType, ItemType> => ({
    pagination: {
      currentPage: parseInt(searchParams.get('page') || '1', 10),
      pageSize: initialPageSize,
    },
    filters: Object.keys(initialFilters).reduce((acc, key) => {
      const searchParamKey = searchParamKeys[key as keyof FilterType] || key;
      const value = searchParams.get(searchParamKey) || initialFilters[key];
      return { ...acc, [key]: value };
    }, {} as FilterType),
    sort: initialSort,
  });

  const [state, setState] = useState<UseListState<FilterType, ItemType>>(getInitialState);

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: page },
    }));
  }, []);

  const setFilter: SetFilterFunction<FilterType> = useCallback((key, value) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: 1 },
      filters: { ...prev.filters, [key]: value },
    }));
  }, []);

  const setSort = useCallback((field: keyof ItemType | null, direction: 'asc' | 'desc' | null) => {
    setState(prev => ({
      ...prev,
      sort: { field, direction },
    }));
  }, []);

  const updateSearchParamsDebounced = useCallback(
    debounce((params: URLSearchParams) => {
      setSearchParams(params);
    }, 300),
    [setSearchParams]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', state.pagination.currentPage.toString());
    Object.entries(state.filters).forEach(([key, value]) => {
      const searchParamKey = searchParamKeys[key as keyof FilterType] || key;
      if (value) {
        params.set(searchParamKey, value.toString());
      }
    });
    if (state.sort.field) {
      params.set('sortField', state.sort.field.toString());
      params.set('sortDirection', state.sort.direction || '');
    }

    updateSearchParamsDebounced(params);

    return () => {
      updateSearchParamsDebounced.cancel(); // Cancel the debounce to prevent it from firing after unmount
    };
  }, [state.pagination.currentPage, state.filters, state.sort, searchParamKeys, updateSearchParamsDebounced]);

  return {
    ...state,
    setCurrentPage,
    setFilter,
    setSort,
  };
};

// Example usage in a component
/*
import React from 'react';
import { useListState } from './useListState';

const initialFilters = { search: '', category: 'all' };

const ListComponent = () => {
  const {
    pagination,
    filters,
    sort,
    setCurrentPage,
    setFilter,
    setSort,
  } = useListState({
    initialPageSize: 20,
    initialFilters,
    initialSort: { field: 'name', direction: 'asc' },
    searchParamKeys: { search: 'q', category: 'cat' },
  });

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (key: keyof typeof initialFilters, value: string) => setFilter(key, value);
  const handleSortChange = (field: keyof typeof initialFilters, direction: 'asc' | 'desc') => setSort(field, direction);

  return (
    <div>
      <p>Current Page: {pagination.currentPage}</p>
      <p>Page Size: {pagination.pageSize}</p>
      <p>Filters: {JSON.stringify(filters)}</p>
      <p>Sort: {JSON.stringify(sort)}</p>
    </div>
  );
};
*/
