import moment, { type Moment } from 'moment';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import type { Transaction } from '@/features/transactions';
import { Transfer } from '@/features/transfers';

/**
 * Stable string key that uniquely identifies any ledger item across types.
 * Transactions and Transfers can share numeric ids, so we prefix by type.
 */
export const itemKey = (item: Transaction | Transfer): string =>
  item instanceof Transfer || 'fromExpense' in (item as object) ? `xfr-${item.id}` : `tx-${item.id}`;

/**
 * Stable sort comparator for ledger items within a day group.
 * Primary: executedAt (direction driven by isReversedOrder).
 * Tiebreaker: id ascending (ensures deterministic order for same-timestamp items).
 */
export const sortItems = (items: (Transaction | Transfer)[], isReversedOrder: boolean): (Transaction | Transfer)[] =>
  [...items].sort((a, b) => {
    const tDiff = isReversedOrder
      ? b.executedAt.valueOf() - a.executedAt.valueOf()
      : a.executedAt.valueOf() - b.executedAt.valueOf();
    return tDiff !== 0 ? tDiff : a.id - b.id;
  });

/**
 * Returns the ordered list of day Moments spanning [after, before] inclusive.
 */
export const buildDateList = (after: Moment, before: Moment, isReversedOrder: boolean): Moment[] => {
  const days: Moment[] = [];
  const current = after.clone().startOf('day');
  const end = before.clone().startOf('day');
  while (current.isSameOrBefore(end, 'day')) {
    days.push(moment(current.format(BACKEND_DATE_FORMAT), BACKEND_DATE_FORMAT));
    current.add(1, 'day');
  }
  return isReversedOrder ? days.reverse() : days;
};
