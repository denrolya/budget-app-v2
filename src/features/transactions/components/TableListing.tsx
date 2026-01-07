import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useMutations } from '@/features/transactions/api/mutations';
import Details from '@/features/transactions/components/Details';
import ListingRow from '@/features/transactions/components/ListingRow';
import { useInlineEdit } from '@/features/transactions/hooks/useInlineEdit';
import Transaction from '@/features/transactions/models/Transaction';
import { confirm } from '@/lib/confirmation';
import cn from 'classnames';
import type { Moment } from 'moment';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';


interface Props extends React.ComponentPropsWithoutRef<'div'> {
  compact?: boolean;
  groupedItems: [Moment, Transaction[], number, number][];
}

export const TableListing: React.FC<Props> = ({ compact = true, groupedItems, ...props }) => {
  const { update: updateTransaction, delete: deleteTransaction, isUpdating } = useMutations();
  const { openForm } = useFormContext();
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
      description: `You are about to delete ${transaction.type} transaction #${transaction.id}(${transaction.account.currency}${transaction.amount}). This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      deleteTransaction(transaction.id);
    }
  };

  const toggleDraft = async (transaction: Transaction) => {
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
    } catch (error) {
      console.error('Failed to unmark transaction as not draft:', error);
      toast.error('Failed to unmark transaction as not draft. Please try again.');
    }
  };

  const columns = useMemo(
    () => [
      { key: 'id', className: cn('pl-4', 'w-[1%]') },
      { key: 'category' },
      { key: 'amount' },
      { key: 'account' },
      { key: 'note', className: cn('text-muted-foreground') },
      { key: 'executedAt' },
      { key: 'actions', className: cn('text-right') },
    ],
    [],
  );

  return (
    <Table {...props}>
      <TableHeader className="sr-only">
        <TableRow>
          <TableHead>Date</TableHead>
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
        {groupedItems.map(([date, transactions, totalValue, count]) => (
          <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
            <TableRow
              className={cn({
                'bg-success/10': totalValue > 0,
                'bg-destructive/10': totalValue < 0,
                'bg-muted/20': count === 0,
              })}
            >
              <TableCell
                colSpan={8}
                className={cn('bg-muted/40', 'px-4', {
                  'py-0': compact,
                })}
              >
                <div className="flex justify-between items-center">
                  <RelativeDatetimeDisplay showDayBadge badgeSize="sm" date={date} showTime={false} variant="default" />
                  <SummaryBadge count={count} icon={ROUTES.TRANSACTION_LIST.icon} value={totalValue} />
                </div>
              </TableCell>
            </TableRow>

            {transactions.map((transaction) => (
              <ListingRow
                columns={columns as any}
                compact={compact}
                inlineEdit={inlineEdit}
                renderDetails={(tx: Transaction) => <Details transaction={tx} />}
                sheetOpen={openSheetId === transaction.id}
                transaction={transaction}
                className="text-xs"
                key={transaction.id}
                onDelete={handleDelete}
                onOpenForm={(tx: Transaction) => openForm(FormType.Transaction, tx)}
                onSheetOpenChange={(open: boolean) => setOpenSheetId(open ? transaction.id : null)}
                onToggleDraft={toggleDraft}
              />
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};

TableListing.displayName = 'TransactionsTableListing';

export default TableListing;
