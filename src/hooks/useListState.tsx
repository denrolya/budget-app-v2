import debounce from 'lodash/debounce';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';

export interface FilterModel {
  setFilter<K extends keyof this>(key: K, value: this[K]): void;
}

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
interface UseListStateOptions<FilterType extends FilterModel, ItemType> {
  initialPageSize?: number;
  initialFilters: FilterType;
  initialSort?: SortState<ItemType>;
  searchParamKeys?: {
    [K in keyof FilterType]?: string;
  };
  formatMoment?: string; // Custom date format for moment objects
  updateUrl?: boolean;   // Flag to enable or disable URL updates
}

/**
 * Custom hook to manage list state including pagination, filters, and sorting.
 * It syncs with URL search parameters for state persistence if updateUrl is true.
 *
 * @template FilterType - Type of the filters
 * @template ItemType - Type of the items in the list
 *
 * @param options - Configuration options for the hook
 * @returns List state and functions to update pagination, filters, and sorting
 */
export const useListState = <FilterType extends FilterModel, ItemType>({
                                                                         initialPageSize = 10,
                                                                         initialFilters,
                                                                         initialSort = {
                                                                           field: null,
                                                                           direction: null,
                                                                         },
                                                                         searchParamKeys = {},
                                                                         formatMoment = 'YYYY-MM-DD',
                                                                         updateUrl = true,
                                                                       }: UseListStateOptions<FilterType, ItemType>) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract initial state from URL search params or fallback to default initial state
  const getInitialState = (): UseListState<FilterType, ItemType> => ({
    pagination: {
      currentPage: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('perPage') || initialPageSize.toString(), 10),
    },
    filters: initialFilters,
    sort: {
      field: (searchParams.get('sortField') as keyof ItemType) || initialSort.field,
      direction: (searchParams.get('sortDirection') as 'asc' | 'desc') || initialSort.direction,
    },
  });

  const [state, setState] = useState<UseListState<FilterType, ItemType>>(getInitialState);

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: page },
    }));
  }, []);

  const setFilter: SetFilterFunction<FilterType> = useCallback((key, value) => {
    setState((prev) => {
      // Properly create a new instance of the filter type to retain methods
      const updatedFilters = new (prev.filters.constructor as { new (): FilterType })();
      Object.assign(updatedFilters, prev.filters); // Copy current filter values
      updatedFilters.setFilter(key, value); // Use the setFilter method from FilterModel

      return {
        ...prev,
        pagination: { ...prev.pagination, currentPage: 1 }, // Reset to first page on filter change
        filters: updatedFilters,
      };
    });
  }, []);

  const setSort = useCallback((field: keyof ItemType | null, direction: 'asc' | 'desc' | null) => {
    setState(prev => ({
      ...prev,
      sort: { field, direction },
    }));
  }, []);

  const updateSearchParamsDebounced = useCallback(
    debounce((params: URLSearchParams) => {
      if (updateUrl) {
        setSearchParams(params);
      }
    }, 300),
    [setSearchParams, updateUrl]
  );

  useEffect(() => {
    if (!updateUrl) return; // Skip URL updates if disabled

    const params = new URLSearchParams();
    params.set('page', state.pagination.currentPage.toString());
    params.set('perPage', state.pagination.pageSize.toString());

    Object.entries(state.filters).forEach(([key, value]) => {
      const searchParamKey = searchParamKeys[key as keyof FilterType] || key;
      const defaultValue = initialFilters[key as keyof FilterType];
      if (value !== undefined && value !== null && value !== '' && value !== defaultValue) {
        const formattedValue = moment.isMoment(value) ? value.format(formatMoment) : value.toString();
        params.set(searchParamKey, formattedValue);
      }
    });

    if (state.sort.field && state.sort.direction) {
      params.set('sortField', state.sort.field.toString());
      params.set('sortDirection', state.sort.direction);
    }

    updateSearchParamsDebounced(params);

    return () => {
      updateSearchParamsDebounced.cancel(); // Cancel the debounce to prevent it from firing after unmount
    };
  }, [
    state.pagination.currentPage,
    state.pagination.pageSize,
    state.filters,
    state.sort,
    searchParamKeys,
    formatMoment,
    updateSearchParamsDebounced,
    updateUrl,
    initialFilters,
  ]);

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
