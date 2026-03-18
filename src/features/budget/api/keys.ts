export const queryKeys = {
  all: () => ['budgets'] as const,
  detail: (id: number) => ['budgets', id] as const,
  analytics: (id: number) => ['budgets', id, 'analytics'] as const,
  analyticsDaily: (id: number) => ['budgets', id, 'analytics-daily'] as const,
  historyAverages: (id: number, months: number) => ['budgets', id, 'history-averages', months] as const,
  insights: (id: number, currency: string) => ['budgets', id, 'insights', currency] as const,
  summaries: () => ['budgets', 'summaries'] as const,
};
