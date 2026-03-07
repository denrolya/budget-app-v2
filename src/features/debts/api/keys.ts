export const queryKeys = {
  all: ['debts'] as const,
  list: (opts?: { withClosed?: boolean }) => [...queryKeys.all, 'list', opts] as const,
  transactions: (id: number) => [...queryKeys.all, 'transactions', id] as const,
};
