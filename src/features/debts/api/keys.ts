export const queryKeys = {
  all: ['debts'] as const,
  list: (opts?: { withClosed?: boolean }) => [...queryKeys.all, 'list', opts] as const,
};
