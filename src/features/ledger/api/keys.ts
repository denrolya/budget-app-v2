/** 5 minutes — matches the default used by useListState */
export const LEDGER_STALE_TIME = 5 * 60 * 1000;

export const queryKeys = {
  all: ['ledger'] as const,
  list: (paramsHash: string) => [...queryKeys.all, 'list', paramsHash] as const,
};
