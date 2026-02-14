export const queryKeys = {
  all: ['debts'] as const,
  list: () => [...queryKeys.all, 'list'] as const,
};
