import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import moment from 'moment';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UseStatisticsParams, ValueByPeriodDataDTO } from '@/types/valueByPeriodStatistics';
import { axiosFetcher } from '@/services/api';
import { useValueByPeriodStatisticsRequest } from '@/hooks/statistics/useValueByPeriodStatisticsRequest';

import { Type as TransactionType } from '@/types/transaction';

vi.mock('@/services/api', () => ({
  axiosFetcher: vi.fn(),
}));

const mockAxiosFetcher = axiosFetcher as unknown as vi.Mock;

const createQueryClient = () => new QueryClient();

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
);

describe('useValueByPeriodStatisticsRequest', () => {
  const params: UseStatisticsParams = {
    after: moment().subtract(7, 'days'),
    before: moment(),
    period: 'weekly',
    type: TransactionType.Expense,
    accounts: ['account1'],
    categories: ['category1'],
    queryKey: 'test-query-key',
  };

  beforeEach(() => {
    mockAxiosFetcher.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useValueByPeriodStatisticsRequest(params), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch and transform data successfully', async () => {
    const mockData: ValueByPeriodDataDTO[] = [
      { after: moment().subtract(7, 'days').unix(), before: moment().unix(), expense: 100, income: 200 },
    ];

    mockAxiosFetcher.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useValueByPeriodStatisticsRequest(params), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

    expect(result.current.data).toEqual([
      {
        after: moment.unix(mockData[0].after),
        before: moment.unix(mockData[0].before),
        expense: 100,
        income: 200,
      },
    ]);
    expect(result.current.error).toBeNull();
  });

  it.skip('should handle API error and log it correctly', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock axiosFetcher to reject with an error
    mockAxiosFetcher.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useValueByPeriodStatisticsRequest(params), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('API Error');
    expect(result.current.data).toEqual([]);

    // Check that the error was logged in the console
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error fetching test-query-key'));

    consoleErrorSpy.mockRestore();
  });

  it.skip('should cancel queries on unmount', async () => {
    const queryClient = createQueryClient();
    const cancelSpy = vi.spyOn(queryClient, 'cancelQueries');
    const { unmount } = renderHook(() => useValueByPeriodStatisticsRequest(params), { wrapper });

    unmount();

    expect(cancelSpy).toHaveBeenCalledWith({ queryKey: ['test-query-key'] });
    cancelSpy.mockRestore();
  });
});
