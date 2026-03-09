export const queryKeys = {
  all: ['accounts'] as const,
  list: () => [...queryKeys.all, 'list'] as const,
  balanceHistory: (id: number, after: string, before: string, interval: string) =>
    [...queryKeys.all, 'balance-history', id, after, before, interval] as const,
  dailyStats: (id: number, after: string, before: string) =>
    [...queryKeys.all, 'daily-stats', id, after, before] as const,
  globalDailyStats: (filters: object, after: string, before: string) =>
    ['global-daily-stats', filters, after, before] as const,
};
