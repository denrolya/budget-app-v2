export const queryKeys = {
  all: ['querys'] as const,
  list: () => [...queryKeys.all, 'list'] as const,
};
