import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

export interface SortState<T> {
  field: keyof T | null;
  direction: 'asc' | 'desc' | null;
}

export interface ListState<FilterType, ItemType> {
  pagination: PaginationState;
  filters: FilterType;
  sort: SortState<ItemType>;
}

type SetFilterFunction<T> = <K extends keyof T>(key: K, value: T[K]) => void

interface UseListStateOptions<FilterType, ItemType> {
  initialPageSize?: number;
  initialFilters: FilterType;
  initialSort?: SortState<ItemType>;
  searchParamKeys?: {
    [K in keyof FilterType]?: string
  };
}

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

  const getInitialState = (): ListState<FilterType, ItemType> => ({
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

  const [state, setState] = useState<ListState<FilterType, ItemType>>(getInitialState);

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

  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', state.pagination.currentPage.toString());
    Object.entries(state.filters).forEach(([key, value]) => {
      const searchParamKey = searchParamKeys[key as keyof FilterType] || key;
      if (value) params.set(searchParamKey, value.toString());
    });
    if (state.sort.field) {
      params.set('sortField', state.sort.field.toString());
      params.set('sortDirection', state.sort.direction || '');
    }
    setSearchParams(params, { replace: true });
  }, [state, setSearchParams, searchParamKeys]);

  return {
    ...state,
    setCurrentPage,
    setFilter,
    setSort,
  };
}
