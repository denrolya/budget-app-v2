/** accountId dragged from unassigned zone */
export const unallocatedDragId = (accountId: number) => `unallocated:${accountId}`;

/** specific bucket allocation dragged */
export const allocationDragId = (accountId: number, bucketId: string) => `allocation:${accountId}:${bucketId}`;

export const parseDragId = (
  id: string,
): { type: 'unallocated'; accountId: number } | { type: 'allocation'; accountId: number; bucketId: string } | null => {
  if (id.startsWith('unallocated:')) {
    return { type: 'unallocated', accountId: Number(id.slice(12)) };
  }
  if (id.startsWith('allocation:')) {
    const rest = id.slice(11); // "accountId:bucketId"
    const colon = rest.indexOf(':');
    if (colon === -1) return null;
    return {
      type: 'allocation',
      accountId: Number(rest.slice(0, colon)),
      bucketId: rest.slice(colon + 1),
    };
  }
  return null;
};
