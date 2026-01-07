export const queryKeys = {
  all: ['transfers'] as const,
  list: (paramsHash: string) => [...queryKeys.all, 'list', paramsHash] as const,
};
