export const queryKeys = {
  all: ['bank-integrations'] as const,
  list: () => [...queryKeys.all, 'list'] as const,
  detail: (id: number) => [...queryKeys.all, 'detail', id] as const,
  accounts: (id: number) => [...queryKeys.all, 'accounts', id] as const,
};
