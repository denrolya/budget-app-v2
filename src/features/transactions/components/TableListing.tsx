import { cn } from '@/lib/utils';
import type { Moment } from 'moment';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import DateGroupHeaderRow from '@/components/common/DateGroupHeaderRow';
import SummaryBadge from '@/components/common/SummaryBadge';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { confirm } from '@/lib/confirmation';

import { useMutations } from '../api/mutations';
import { useInlineEdit } from '../hooks/useInlineEdit';
import Transaction from '../models/Transaction';

import Details from './Details';
import ListingRow, { type TransactionRowColumn } from './ListingRow';

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
      { key: 'id', className: 'pl-4' },
      { key: 'account' },
      { key: 'amount' },
      { key: 'category' },
      { key: 'note', className: 'text-muted-foreground' },
      { key: 'executedAt' },
      { key: 'actions', className: 'text-right' },
    ],
    [],
  );

  return (
    <div className="overflow-x-auto" {...props}>
      <Table className="min-w-[700px]">
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead />
            <TableHead>ID</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {groupedItems.map(([date, transactions, totalValue, count]) => {
            const dateKey = date.format(BACKEND_DATE_FORMAT);

            return (
              <React.Fragment key={dateKey}>
                <DateGroupHeaderRow
                  compact={compact}
                  cellClassName="bg-muted/40"
                  rowClassName={cn({
                    'bg-success/10': totalValue > 0,
                    'bg-destructive/10': totalValue < 0,
                    'bg-muted/20': count === 0,
                  })}
                  left={
                    <RelativeDatetimeDisplay
                      showDayBadge
                      badgeSize="sm"
                      date={date}
                      showTime={false}
                      variant="default"
                    />
                  }
                  right={
                    <SummaryBadge count={count} icon={ROUTES.TRANSACTION_LIST.icon} value={totalValue} />
                  }
                />

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
