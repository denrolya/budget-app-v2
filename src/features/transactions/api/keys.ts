export const queryKeys = {
  all: ['transactions'] as const,
  list: (paramsHash: string) => [...queryKeys.all, 'list', paramsHash] as const,
};
