export const queryKeys = {
  all: () => ['budgets'] as const,
  detail: (id: number) => ['budgets', id] as const,
  analytics: (id: number) => ['budgets', id, 'analytics'] as const,
  analyticsDaily: (id: number) => ['budgets', id, 'analytics-daily'] as const,
  historyAverages: (id: number, months: number) => ['budgets', id, 'history-averages', months] as const,
  insights: (id: number) => ['budgets', id, 'insights'] as const,
};
