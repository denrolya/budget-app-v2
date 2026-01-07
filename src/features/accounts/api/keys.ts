export const queryKeys = {
  all: ['accounts'] as const,
  list: () => [...queryKeys.all, 'list'] as const,
};
