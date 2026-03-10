import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import moment, { Moment } from 'moment';
import * as ReactRouterDom from 'react-router-dom';
import { vi } from 'vitest';

import BaseFilters from '@/models/BaseFilters';
import { useListState } from '@/hooks/useListState';
import { buildListStateSearchParams } from '@/lib/url/buildListStateSearchQueryParams';

const setSearchParamsMock = vi.fn();
const getSearchParamsMock = vi.fn(() => new URLSearchParams());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>('react-router-dom');

  return {
    ...actual,
    useSearchParams: vi.fn(() => [getSearchParamsMock(), setSearchParamsMock]),
  };
});

class DummyFilterModel extends BaseFilters {
  foo: string;
  date: Moment;
  accounts: number[] | string[];

  constructor(foo: string, date: moment.Moment, accounts: number[] | string[] = []) {
    super();

    const filled = {
      foo: foo ?? '',
      date: date ?? moment(),
      accounts: [...accounts],
    };

    this._defaults = {
      ...filled,
      date: filled.date.clone(),
    };

    Object.assign(this, filled);
  }
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ReactRouterDom.MemoryRouter>{children}</ReactRouterDom.MemoryRouter>
    </QueryClientProvider>
  );
};

describe('useListState', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
    getSearchParamsMock.mockReset();
    setSearchParamsMock.mockReset();
    vi.mock('lodash/debounce', () => ({
      default: (fn: any) => {
        fn.cancel = vi.fn();
        return fn;
      },
    }));
  });
  const mockQueryFn = vi.fn().mockResolvedValue({
    totalItems: 100,
  });

  it('initializes with correct state', async () => {
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
    expect(result.current.pagination.currentPage).toBe(1);

    act(() => {
      result.current.pagination.setCurrentPage(3);
    });

    expect(result.current.pagination.currentPage).toBe(3);
  });

  it('sorts correctly when setSort is called', async () => {
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

  it('calls setSearchParams when state changes', async () => {
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment('2024-01-01')),
          queryFn: mockQueryFn,
          searchParamKeys: { foo: 'foo' },
          updateUrl: true,
          enabled: false,
          staleTime: 0,
          gcTime: 0,
        }),
      { wrapper },
    );

    act(() => {
      result.current.setFilter('foo', 'changed');
      result.current.pagination.setCurrentPage(2);
      result.current.sort.setSort({ field: 'foo', direction: 'asc' });
    });

    await waitFor(() => {
      expect(setSearchParamsMock).toHaveBeenCalled();
      const lastCallArg = setSearchParamsMock.mock.calls.at(-1)[0];
      expect(lastCallArg.get('foo')).toBe('changed');
      expect(lastCallArg.get('page')).toBe('2');
      expect(lastCallArg.get('sortField')).toBe('foo');
      expect(lastCallArg.get('sortDirection')).toBe('asc');
    });
  });

  it('updates filters and resets page to 1', async () => {
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment('2024-01-01')),
          queryFn: mockQueryFn,
          updateUrl: true,
          searchParamKeys: { foo: 'foo' },
          enabled: false,
        }),
      { wrapper },
    );

    act(() => {
      result.current.pagination.setCurrentPage(5);
      result.current.setFilter('foo', 'new');
    });

    expect(result.current.filters.foo).toBe('new');
    expect(result.current.pagination.currentPage).toBe(1);
    expect(setSearchParamsMock).toHaveBeenCalledWith(expect.any(URLSearchParams));
  });

  it('resets filters to initial and resets page', async () => {
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('reset', moment('2024-01-01')),
          queryFn: mockQueryFn,
          updateUrl: true,
          searchParamKeys: { foo: 'foo' },
          enabled: false,
        }),
      { wrapper },
    );

    act(() => {
      result.current.setFilter('foo', 'changed');
      result.current.resetFilters();
    });

    expect(result.current.filters.foo).toBe('reset');
    expect(result.current.pagination.currentPage).toBe(1);
  });

  it('updates sort state and reflects in search params', async () => {
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('foo', moment()),
          queryFn: mockQueryFn,
          updateUrl: true,
          enabled: false,
        }),
      { wrapper },
    );

    act(() => {
      result.current.sort.setSort({ field: 'foo', direction: 'desc' });
    });

    expect(result.current.sort.field).toBe('foo');
    expect(result.current.sort.direction).toBe('desc');
    expect(setSearchParamsMock).toHaveBeenCalledWith(expect.any(URLSearchParams));
  });

  it('updates perPage and resets page to 1', async () => {
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment()),
          queryFn: mockQueryFn,
          updateUrl: true,
          enabled: false,
        }),
      { wrapper },
    );

    act(() => {
      result.current.pagination.setCurrentPage(3);
      result.current.pagination.setPerPage(50);
    });

    expect(result.current.pagination.perPage).toBe(50);
    expect(result.current.pagination.currentPage).toBe(1);
    expect(setSearchParamsMock).toHaveBeenCalledWith(expect.any(URLSearchParams));
  });

  it('updates queryKey when filters or sort changes', async () => {
    const queryFn = vi.fn().mockResolvedValue({ totalItems: 0 });

    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment()),
          queryFn,
        }),
      { wrapper },
    );

    act(() => {
      result.current.setFilter('foo', 'x');
      result.current.sort.setSort({ field: 'foo', direction: 'desc' });
      result.current.pagination.setCurrentPage(2);
    });

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledWith(2, 20, expect.any(DummyFilterModel), { field: 'foo', direction: 'desc' });
    });
  });

  it('does not call setSearchParams when updateUrl is false', async () => {
    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment('2024-01-01')),
          queryFn: mockQueryFn,
          updateUrl: false,
          searchParamKeys: { foo: 'foo' },
          enabled: false,
        }),
      { wrapper },
    );

    act(() => {
      result.current.setFilter('foo', 'changed');
      result.current.pagination.setCurrentPage(3);
      result.current.sort.setSort({ field: 'foo', direction: 'desc' });
    });

    expect(setSearchParamsMock).not.toHaveBeenCalled();
  });

  it('initializes state correctly from search params on mount (like after refresh)', async () => {
    getSearchParamsMock.mockReturnValueOnce(
      new URLSearchParams({
        page: '3',
        perPage: '50',
        foo: 'fromQuery',
        sortField: 'foo',
        sortDirection: 'desc',
      }),
    );

    const { result } = renderHook(
      () =>
        useListState<DummyFilterModel, { totalItems: number }, any>({
          initialFilters: new DummyFilterModel('init', moment('2024-01-01')),
          queryFn: mockQueryFn,
          searchParamKeys: { foo: 'foo' },
          enabled: false,
        }),
      { wrapper },
    );

    expect(result.current.pagination.currentPage).toBe(3);
    expect(result.current.pagination.perPage).toBe(50);
    expect(result.current.filters.foo).toBe('fromQuery');
    expect(result.current.sort.field).toBe('foo');
    expect(result.current.sort.direction).toBe('desc');
  });

  it('does not include default pagination and sorting params in URL', () => {
    const params = buildListStateSearchParams(
      {
        pagination: { currentPage: 1, perPage: 20 },
        filters: new DummyFilterModel('init', moment('2024-01-01')),
        sort: { field: 'foo', direction: 'asc' },
      },
      {
        filters: new DummyFilterModel('init', moment('2024-01-01')),
        initialPerPage: 20,
        initialSort: { field: 'foo', direction: 'asc' },
      },
      {},
      'YYYY-MM-DD',
    );

    expect(params.toString()).toBe('');
  });

  it('includes pagination and sorting if they differ from defaults', () => {
    const params = buildListStateSearchParams(
      {
        pagination: { currentPage: 2, perPage: 10 },
        filters: new DummyFilterModel('init', moment('2024-01-01')),
        sort: { field: 'bar', direction: 'desc' },
      },
      {
        filters: new DummyFilterModel('init', moment('2024-01-01')),
        initialPerPage: 20,
        initialSort: { field: 'foo', direction: 'asc' },
      },
      {},
      'YYYY-MM-DD',
    );

    expect(params.get('page')).toBe('2');
    expect(params.get('perPage')).toBe('10');
    expect(params.get('sortField')).toBe('bar');
    expect(params.get('sortDirection')).toBe('desc');
  });

  it('omits moment filter if equal to default', () => {
    const filters = new DummyFilterModel('init', moment('2024-01-01'));
    const params = buildListStateSearchParams(
      {
        pagination: { currentPage: 1, perPage: 20 },
        filters,
        sort: { field: '', direction: 'asc' },
      },
      {
        filters,
        initialPerPage: 20,
        initialSort: { field: '', direction: 'asc' },
      },
      {},
      'YYYY-MM-DD',
    );

    expect(params.has('date')).toBe(false);
  });

  it('includes moment filter if different from default', () => {
    const params = buildListStateSearchParams(
      {
        pagination: { currentPage: 1, perPage: 20 },
        filters: new DummyFilterModel('init', moment('2024-02-01')),
        sort: { field: '', direction: 'asc' },
      },
      {
        filters: new DummyFilterModel('init', moment('2024-01-01')),
        initialPerPage: 20,
        initialSort: { field: '', direction: 'asc' },
      },
      {},
      'YYYY-MM-DD',
    );

    expect(params.get('date')).toBe('2024-02-01');
  });

  it('serializes array values as CSV in search params', () => {
    const filters = new DummyFilterModel('foo', moment('2024-01-01'), ['22', '29']);

    const params = buildListStateSearchParams(
      {
        pagination: { currentPage: 1, perPage: 20 },
        filters,
        sort: { field: '', direction: 'asc' },
      },
      {
        filters: new DummyFilterModel('foo', moment('2024-01-01'), []),
        initialPerPage: 20,
        initialSort: { field: '', direction: 'asc' },
      },
      {},
      'YYYY-MM-DD',
    );

    expect(params.get('accounts')).toBe('22,29');
  });
});
