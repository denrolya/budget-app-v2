import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
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

  const getInitialState = useCallback((): UseListState<FilterType, ItemType> => ({
    pagination: {
      currentPage: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('perPage') || initialPageSize.toString(), 10),
    },
    filters: initialFilters,
    sort: {
      field: (searchParams.get('sortField') as keyof ItemType) || initialSort.field,
      direction: (searchParams.get('sortDirection') as 'asc' | 'desc') || initialSort.direction,
    },
  }), [searchParams, initialPageSize, initialFilters, initialSort]);

  const [state, setState] = useState<UseListState<FilterType, ItemType>>(getInitialState);

  const prevStateRef = useRef(state);

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: page },
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

  const setSort = useCallback((field: keyof ItemType | null, direction: 'asc' | 'desc' | null) => {
    setState(prev => ({
      ...prev,
      sort: { field, direction },
    }));
  }, []);

  const updateSearchParamsDebounced = useMemo(
    () => debounce((params: URLSearchParams) => {
      if (updateUrl) {
        setSearchParams(params);
      }
    }, 300),
    [setSearchParams, updateUrl]
  );

  useEffect(() => {
    if (!updateUrl) return;

    const hasStateChanged = !isEqual({
      pagination: state.pagination,
      filters: state.filters,
      sort: state.sort
    }, {
      pagination: prevStateRef.current.pagination,
      filters: prevStateRef.current.filters,
      sort: prevStateRef.current.sort
    });

    if (!hasStateChanged) return;

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
    prevStateRef.current = state;

    return () => {
      updateSearchParamsDebounced.cancel();
    };
  }, [
    state,
    prevStateRef,
    searchParamKeys,
    formatMoment,
    updateSearchParamsDebounced,
    updateUrl,
    initialFilters,
  ]);

  return useMemo(() => ({
    ...state,
    setCurrentPage,
    setFilter,
    setSort,
  }), [state, setCurrentPage, setFilter, setSort]);
};
