import { Moment } from 'moment';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import TransactionDetails from '@/features/transactions/components/Details';
import TransactionRow from '@/features/transactions/components/ListingRow';
import TransferDetails from '@/features/transfers/components/Details';
import TransferRow from '@/features/transfers/components/ListingRow';
import { useInlineTransactionEdit } from '@/hooks/useInlineTransactionEdit';
import { useTransactionMutations } from '@/hooks/useTransactionMutations';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';

interface Props {
  isLoading: boolean;
  groupedItems: [Moment, (Transaction | Transfer)[], number, number, number, number][];
  after: Moment;
  before: Moment;
  showEmptyDays?: boolean;
  isReversedOrder?: boolean;
  compact?: boolean;
}

const TableListing: React.FC<Props> = ({
                                         groupedItems,
                                         after,
                                         before,
                                         showEmptyDays = true,
                                         isReversedOrder = false,
                                         compact = true,
                                       }) => {
  const { updateTransaction, deleteTransaction, isUpdating } = useTransactionMutations();
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

  const inlineEdit = useInlineTransactionEdit({
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

    const confirmed = await confirm({
      title: 'Are you absolutely sure?',
      description: `You are about to delete ${itemType} #${item.id}. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    if ('fromExpense' in item) {
      // TODO: wire your transfer delete mutation here
      console.log('Delete transfer:', item.id);
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
      { key: 'id', className: cn('pl-4', 'w-[1%]') },
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
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead className="w-4"></TableHead>
            <TableHead className="w-1/12">ID</TableHead>
            <TableHead className="w-2/12">Type</TableHead>
            <TableHead className="w-2/12">Amount</TableHead>
            <TableHead className="w-2/12">Category/Rate</TableHead>
            <TableHead className="w-2/12">Note</TableHead>
            <TableHead className="w-1/12">Time</TableHead>
            <TableHead className="w-1/12 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {dates.map((date) => {
            const [, items, transactionsValue, transfersValue, transactionsCount, transfersCount] =
            groupedItems?.find((group) => group[0].isSame(date, 'day')) || [null, [], 0, 0, 0, 0];

            if (!showEmptyDays && items.length === 0) return null;

            return (
              <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
                <TableRow
                  className={cn({
                    'bg-success/10': transactionsValue > 0,
                    'bg-destructive/10': transactionsValue < 0,
                  })}
                >
                  <TableCell
                    colSpan={8}
                    className={cn('font-semibold', 'px-4', {
                      'py-0': compact,
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <RelativeDatetimeDisplay
                          showDayBadge
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
                        onViewDetailsClick={() =>
                          setOpenSheetId((prev) => (prev === transfer.id ? null : transfer.id))
                        }
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
                      className={cn('text-xs')}
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
