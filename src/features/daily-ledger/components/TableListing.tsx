import { Moment } from 'moment';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useMutations as useTransactionsMutations } from '@/features/transactions/api/mutations';
import { useMutations as useTransfersMutations } from '@/features/transfers/api/mutations';
import TransactionDetails from '@/features/transactions/components/Details';
import TransactionRow from '@/features/transactions/components/ListingRow';
import { useInlineEdit } from '@/features/transactions/hooks/useInlineEdit';
import Transaction from '@/features/transactions/models/Transaction';
import TransferDetails from '@/features/transfers/components/Details';
import TransferRow from '@/features/transfers/components/ListingRow';
import Transfer from '@/features/transfers/models/Transfer';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';

interface Props {
  isLoading: boolean;
  groupedItems: [Moment, (Transaction | Transfer)[], number, number, number, number][];
  after: Moment;
  before: Moment;
  showEmptyDays?: boolean;
  isReversedOrder?: boolean;
  compact?: boolean;
}

export const COLS = {
  gutter: 'w-3 shrink-0',
  id: 'w-[74px] shrink-0',
  account: 'w-[260px]',
  amount: 'w-[200px] shrink-0',
  category: 'w-[150px]',
  note: 'w-auto',
  executedAt: 'w-[72px] shrink-0',
  actions: 'w-[96px] shrink-0',
} as const;

const TableListing: React.FC<Props> = ({
                                         groupedItems,
                                         after,
                                         before,
                                         showEmptyDays = true,
                                         isReversedOrder = false,
                                         compact = true,
                                       }) => {
  const { update: updateTransaction, delete: deleteTransaction, isUpdating } = useTransactionsMutations();
  const { delete: deleteTransfer } = useTransfersMutations();
  const { openForm } = useFormContext();

  const [openSheetId, setOpenSheetId] = useState<number | null>(null);

  const dates = useMemo(() => {
    const d: Moment[] = [];
    const current = after.clone();
    while (current.isSameOrBefore(before)) {
      d.push(current.clone());
      current.add(1, 'day');
    }
    return isReversedOrder ? d.reverse() : d;
  }, [after, before, isReversedOrder]);

  const inlineEdit = useInlineEdit({
    isUpdating,
    onSave: async ({ original, updates }) => {
      await updateTransaction({
        id: original.id,
        updates: { ...original, ...updates },
        originalTransaction: original,
      });
      toast.success('Item updated successfully');
    },
  });

  const handleDelete = async (item: Transaction | Transfer) => {
    const itemType = 'fromExpense' in item ? 'transfer' : 'transaction';

    const isConfirmed = await confirm({
      title: 'Are you absolutely sure?',
      description: `You are about to delete ${itemType} #${item.id}. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!isConfirmed) return;

    if ('fromExpense' in item) {
      await deleteTransfer(Number(item.id));
      return;
    }

    deleteTransaction(Number(item.id));
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

  const transactionColumns = useMemo(
    () => [
      { key: 'id', className: cn('pl-4') },
      { key: 'account' },
      { key: 'amount' },
      { key: 'category' },
      { key: 'note', className: cn('text-muted-foreground') },
      { key: 'executedAt' },
      { key: 'actions', className: cn('text-right') },
    ],
    [],
  );

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <Table className="w-full min-w-[768px] table-fixed">
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
          {dates.map((date) => {
            const found =
              groupedItems?.find((group) => group[0].isSame(date, 'day')) ?? ([null, [], 0, 0, 0, 0] as any);

            const [, items, transactionsValue, transfersValue, transactionsCount, transfersCount] = found as [
                Moment | null,
              (Transaction | Transfer)[],
              number,
              number,
              number,
              number,
            ];

            if (!showEmptyDays && items.length === 0) return null;

            return (
              <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
                <TableRow
                  className={cn({
                    'bg-success/10': transactionsValue > 0,
                    'bg-destructive/10': transactionsValue < 0,
                  })}
                >
                  <TableCell colSpan={8} className={cn('font-semibold px-4', compact && 'py-0')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <RelativeDatetimeDisplay
                          showDayBadge
                          showRelative
                          badgeSize="sm"
                          date={date}
                          showTime={false}
                          variant="default"
                          className="font-normal"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <SummaryBadge
                          count={transactionsCount}
                          icon={ROUTES.TRANSACTION_LIST.icon}
                          value={transactionsValue}
                        />
                        <SummaryBadge
                          count={transfersCount}
                          icon={ROUTES.TRANSFER_LIST.icon}
                          useColors={false}
                          value={transfersValue}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>

                {items.map((item) => {
                  if (item instanceof Transfer || 'fromExpense' in (item as any)) {
                    const transfer = item as Transfer;

                    return (
                      <TransferRow
                        compact={compact}
                        renderDetails={(t) => <TransferDetails transfer={t} />}
                        sheetOpen={openSheetId === transfer.id}
                        transfer={transfer}
                        key={`transfer-${transfer.id}`}
                        onDelete={(t) => handleDelete(t)}
                        onSheetOpenChange={(open) => setOpenSheetId(open ? transfer.id : null)}
                      />
                    );
                  }

                  const transaction = item as Transaction;

                  return (
                    <TransactionRow
                      columns={transactionColumns as any}
                      compact={compact}
                      inlineEdit={inlineEdit}
                      renderDetails={(t) => <TransactionDetails transaction={t} />}
                      sheetOpen={openSheetId === transaction.id}
                      transaction={transaction}
                      className="text-xs"
                      key={`tx-${transaction.id}`}
                      onDelete={(t) => handleDelete(t)}
                      onOpenForm={(t) => openForm(FormType.Transaction, t)}
                      onSheetOpenChange={(open) => setOpenSheetId(open ? transaction.id : null)}
                      onToggleDraft={toggleDraft}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

TableListing.displayName = 'TransactionAndTransfersTableListing';

export default TableListing;
