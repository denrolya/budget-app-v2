import cn from 'classnames';
import type { Moment } from 'moment';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { confirm } from '@/lib/confirmation';

import { useMutations } from '../api/mutations';
import { useInlineEdit } from '../hooks/useInlineEdit';
import Transaction from '../models/Transaction';

import Details from './Details';
import ListingRow, { type TransactionRowColumn } from './ListingRow';

const COLS = {
  gutter: 'w-3 shrink-0',
  id: 'w-[74px] shrink-0',
  account: 'w-[260px]',
  amount: 'w-[200px] shrink-0',
  category: 'w-[150px]',
  note: 'w-auto',
  executedAt: 'w-[72px] shrink-0',
  actions: 'w-[96px] shrink-0',
} as const;

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  compact?: boolean;
  groupedItems: [Moment, Transaction[], number, number][];
}

export const TableListing: React.FC<Props> = ({ compact = true, groupedItems, ...props }) => {
  const { openForm } = useFormContext();
  const { update: updateTransaction, delete: deleteTransaction, isUpdating } = useMutations();

  const [openSheetId, setOpenSheetId] = useState<number | null>(null);

  const inlineEdit = useInlineEdit({
    isUpdating,
    onSave: async ({ original, updates }) => {
      await updateTransaction({
        id: original.id,
        updates: { ...original, ...updates },
        originalTransaction: original,
      });
    },
  });

  const handleDelete = async (transaction: Transaction) => {
    const confirmed = await confirm({
      title: 'Are you absolutely sure?',
      description: `You are about to delete ${transaction.type} transaction #${transaction.id} (${transaction.account.currency}${transaction.amount}). This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) deleteTransaction(transaction.id);
  };

  const handleToggleDraft = async (transaction: Transaction) => {
    const confirmed = await confirm({
      title: 'Are you sure you want to unmark this transaction as draft?',
      description: `This will unmark transaction #${transaction.id} as not draft.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await updateTransaction({
        id: transaction.id,
        updates: { ...transaction, isDraft: false },
        originalTransaction: transaction,
      });
      toast.success('Transaction unmarked as not draft');
    } catch {
      toast.error('Failed to unmark transaction as not draft. Please try again.');
    }
  };

  const columns = useMemo<TransactionRowColumn[]>(
    () => [
      { key: 'id', className: cn('pl-4', COLS.id) },
      { key: 'account', className: COLS.account },
      { key: 'amount', className: COLS.amount },
      { key: 'category', className: COLS.category },
      { key: 'note', className: cn(COLS.note, 'text-muted-foreground') },
      { key: 'executedAt', className: COLS.executedAt },
      { key: 'actions', className: cn(COLS.actions, 'text-right') },
    ],
    [],
  );

  const totalColumnsCount = 1 + columns.length;

  return (
    <div className="w-full min-w-0 overflow-x-auto" {...props}>
      <Table className="w-full min-w-0 table-fixed">
        <colgroup>
          <col className={COLS.gutter} />
          <col className={COLS.id} />
          <col className={COLS.account} />
          <col className={COLS.amount} />
          <col className={COLS.category} />
          <col className={COLS.note} />
          <col className={COLS.executedAt} />
          <col className={COLS.actions} />
        </colgroup>

        <TableHeader className="sr-only">
          <TableRow>
            <TableHead>Gutter</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {groupedItems.map(([date, transactions, totalValue, count]) => {
            const dateKey = date.format(BACKEND_DATE_FORMAT);

            return (
              <React.Fragment key={dateKey}>
                <TableRow
                  className={cn({
                    'bg-success/10': totalValue > 0,
                    'bg-destructive/10': totalValue < 0,
                    'bg-muted/20': count === 0,
                  })}
                >
                  <TableCell colSpan={totalColumnsCount} className={cn('bg-muted/40 px-4', compact && 'py-0')}>
                    <div className="flex items-center justify-between">
                      <RelativeDatetimeDisplay
                        showDayBadge
                        badgeSize="sm"
                        date={date}
                        showTime={false}
                        variant="default"
                      />
                      <SummaryBadge count={count} icon={ROUTES.TRANSACTION_LIST.icon} value={totalValue} />
                    </div>
                  </TableCell>
                </TableRow>

                {transactions.map((transaction) => (
                  <ListingRow
                    columns={columns}
                    compact={compact}
                    inlineEdit={inlineEdit}
                    renderDetails={(tx) => <Details transaction={tx} />}
                    sheetOpen={openSheetId === transaction.id}
                    transaction={transaction}
                    className="text-xs"
                    key={transaction.id}
                    onDelete={handleDelete}
                    onOpenForm={(tx) => openForm(FormType.Transaction, tx)}
                    onSheetOpenChange={(open) => setOpenSheetId(open ? transaction.id : null)}
                    onToggleDraft={handleToggleDraft}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

TableListing.displayName = 'TransactionsTableListing';

export default TableListing;
