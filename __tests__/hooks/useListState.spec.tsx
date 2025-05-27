import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import moment, { Moment } from 'moment';
import { vi } from 'vitest';

import { useListState } from '@/hooks/useListState';
import BaseFilters from '@/models/BaseFilters';

class DummyFilterModel extends BaseFilters {
  foo: string;
  date: Moment;

  constructor(foo: string, date: moment.Moment) {
    super();

    const filled = {
      foo: foo ?? '',
      date: date ?? moment(),
    };

    this._defaults = {
      ...filled,
      date: filled.date.clone(),
    };

    Object.assign(this, filled);
  }

  static fromSearchParams() {
    return new DummyFilterModel('test', moment('2024-01-01'));
  }
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('useListState', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });
  const mockQueryFn = vi.fn().mockResolvedValue({
    totalItems: 100,
  });

  it('initializes with correct state', async () => {
    wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('test', moment('2024-01-01')),
          queryFn: mockQueryFn,
        }),
      { wrapper },
    );

    expect(result.current.pagination.currentPage).toBe(1);
    expect(result.current.pagination.perPage).toBe(20);
    expect(result.current.filters.foo).toBe('test');
  });

  it('updates filters and resets correctly', async () => {
    wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('test', moment('2024-01-01')),
          queryFn: mockQueryFn,
        }),
      { wrapper },
    );

    act(() => {
      result.current.setFilter('foo', 'bar');
    });

    expect(result.current.filters.foo).toBe('bar');

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.foo).toBe('test');
  });

  it('changes perPage resets page, and page can be updated', async () => {
    wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('test', moment('2024-01-01')),
          queryFn: mockQueryFn,
        }),
      { wrapper },
    );

    act(() => {
      result.current.pagination.setPerPage(10);
    });

    expect(result.current.pagination.perPage).toBe(10);
    expect(result.current.pagination.currentPage).toBe(1); // reset page

    act(() => {
      result.current.pagination.setCurrentPage(3);
    });

    expect(result.current.pagination.currentPage).toBe(3);
  });

  it('sorts correctly when setSort is called', async () => {
    wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment()),
          initialSort: { field: 'foo', direction: 'asc' },
          queryFn: mockQueryFn,
        }),
      { wrapper },
    );

    expect(result.current.sort.field).toBe('foo');
    expect(result.current.sort.direction).toBe('asc');

    act(() => {
      result.current.sort.setSort({ field: 'foo', direction: 'desc' });
    });

    expect(result.current.sort.direction).toBe('desc');
  });

  it('passes correct parameters to queryFn and updates totalPages', async () => {
    wrapper = createWrapper();
    const customQueryFn = vi.fn().mockResolvedValue({ totalItems: 45 });

    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment()),
          queryFn: customQueryFn,
        }),
      { wrapper },
    );

    await waitFor(() => result.current.isSuccess);

    expect(customQueryFn).toHaveBeenCalledWith(1, 20, expect.any(Object), expect.any(Object));
    expect(result.current.pagination.totalItems).toBe(45);
    expect(result.current.pagination.totalPages).toBe(3);
  });

  it('respects "enabled = false" and does not call queryFn', () => {
    wrapper = createWrapper();
    const queryFn = vi.fn();

    renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment()),
          queryFn,
          enabled: false,
        }),
      { wrapper },
    );

    expect(queryFn).not.toHaveBeenCalled();
  });

  it('updates URL searchParams when updateUrl is true', async () => {
    wrapper = createWrapper();

    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment('2024-01-01')),
          queryFn: mockQueryFn,
          searchParamKeys: { foo: 'foo', date: 'date' },
          updateUrl: true,
        }),
      { wrapper },
    );

    act(() => {
      result.current.setFilter('foo', 'hello');
      result.current.sort.setSort({ field: 'foo', direction: 'desc' });
      result.current.pagination.setCurrentPage(2);
    });

    await waitFor(() => {
      const sp = new URLSearchParams(window.location.search);
      expect(sp.get('foo')).toBe('hello');
      expect(sp.get('page')).toBe('2');
      expect(sp.get('sortField')).toBe('foo');
      expect(sp.get('sortDirection')).toBe('desc');
    });
  });
});
