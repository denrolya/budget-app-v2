export const queryKeys = {
  all: () => ['budgets'] as const,
  detail: (id: number) => ['budgets', id] as const,
  analytics: (id: number) => ['budgets', id, 'analytics'] as const,
};
