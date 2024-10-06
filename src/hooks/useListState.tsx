import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';

export interface FilterModel {
  setFilter<K extends keyof this>(key: K, value: this[K]): void;
}

export interface PaginationState {
  currentPage: number;
  perPage: number;
  totalPages: number;
}

export interface SortState<T> {
  field: keyof T | null;
  direction: 'asc' | 'desc' | null;
}

export interface UseListState<FilterType, ItemType> {
  pagination: PaginationState;
  filters: FilterType;
  sort: SortState<ItemType>;
}

type SetFilterFunction<T> = <K extends keyof T>(key: K, value: T[K]) => void;

interface UseListStateOptions<FilterType extends FilterModel, ItemType> {
  initialPerPage?: number;
  initialFilters: FilterType;
  initialSort?: SortState<ItemType>;
  searchParamKeys?: {
    [K in keyof FilterType]?: string;
  };
  formatMoment?: string;
  updateUrl?: boolean;
}

export const useListState = <FilterType extends FilterModel, ItemType>({
                                                                         initialPerPage = 30,
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
      perPage: parseInt(searchParams.get('perPage') || initialPerPage.toString(), 10),
      totalPages: parseInt(searchParams.get('totalPages') || '0', 10),
    },
    filters: initialFilters,
    sort: {
      field: (searchParams.get('sortField') as keyof ItemType) || initialSort.field,
      direction: (searchParams.get('sortDirection') as 'asc' | 'desc') || initialSort.direction,
    },
  }), [searchParams, initialPerPage, initialFilters, initialSort]);

  const [state, setState] = useState<UseListState<FilterType, ItemType>>(getInitialState);

  const prevStateRef = useRef(state);

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: page },
    }));
  }, []);

  const setTotalPages = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, totalPages: count },
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
    setState(prev => ({
      ...prev,
      filters: initialFilters,
      pagination: { ...prev.pagination, currentPage: 1 },
    }));
  }, [initialFilters]);

  const setSort = useCallback((field: keyof ItemType | null, direction: 'asc' | 'desc' | null) => {
    setState(prev => ({
      ...prev,
      sort: { field, direction },
    }));
  }, []);

  const updateSearchParamsDebounced = useMemo(
    () => debounce((params: URLSearchParams) => {
      if (updateUrl) {
        for (const [key, value] of params.entries()) {
          if (!value) {
            params.delete(key);
          }
        }
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
    resetFilters,
    setSort,
    setTotalPages,
  }), [state, setCurrentPage, setFilter, setSort, setTotalPages, resetFilters]);
};
