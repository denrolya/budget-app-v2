import { ArrowLeftRight, FileText } from 'lucide-react';
import { type Moment } from 'moment';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import DateGroupHeaderRow from '@/components/common/DateGroupHeaderRow';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import {
  type Transaction,
  type TransactionRowColumn,
  TransactionDetails,
  TransactionListingRow as TransactionRow,
  useInlineEdit,
  useMutations as useTransactionsMutations,
} from '@/features/transactions';
import {
  Transfer,
  TransferDetails,
  TransferListingRow as TransferRow,
  useMutations as useTransfersMutations,
} from '@/features/transfers';
import { cn } from '@/lib/utils';
import { confirm } from '@/lib/confirmation';

import { type GroupedItem } from '../hooks/useList';
import { buildDateList, itemKey, sortItems } from '../utils';

interface Props {
  groupedItems: GroupedItem[];
  after: Moment;
  before: Moment;
  showEmptyDays?: boolean;
  isReversedOrder?: boolean;
  selectedKey?: string | null;
  onSelectItem?: (item: Transaction | Transfer) => void;
}

const TableListing: React.FC<Props> = ({
  groupedItems,
  after,
  before,
  showEmptyDays = true,
  isReversedOrder = false,
  selectedKey,
  onSelectItem,
}) => {
  const { update: updateTransaction, delete: deleteTransaction, isUpdating } = useTransactionsMutations();
  const { delete: deleteTransfer } = useTransfersMutations();
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
      toast.success('Item updated successfully');
    },
  });

  const handleDelete = async (item: Transaction | Transfer) => {
    const isTransferItem = 'fromExpense' in item;
    const itemType = isTransferItem ? 'transfer' : 'transaction';

    let description: string;
    if (isTransferItem) {
      const t = item as Transfer;
      const notePart = t.note ? ` — "${t.note}"` : '';
      description = `Delete transfer ${t.fromExpense.account.name} → ${t.toIncome.account.name}${notePart}. This cannot be undone.`;
    } else {
      const tx = item as Transaction;
      const notePart = tx.note ? ` — "${tx.note}"` : '';
      description = `Delete ${tx.type} of ${Math.abs(tx.amount).toLocaleString()} ${tx.account.currency} from ${tx.account.name}${notePart}. This cannot be undone.`;
    }

    const confirmed = await confirm({
      title: `Delete ${itemType}?`,
      description,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    if (isTransferItem) {
      await deleteTransfer(Number(item.id));
      return;
    }
    deleteTransaction(Number((item as Transaction).id));
  };

  const toggleDraft = async (transaction: Transaction) => {
    const confirmed = await confirm({
      title: 'Mark as confirmed?',
      description: 'This will remove the draft status and mark the transaction as confirmed.',
      confirmText: 'Mark as confirmed',
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

  const dates = useMemo(() => buildDateList(after, before, isReversedOrder), [after, before, isReversedOrder]);

  const transactionColumns = useMemo<TransactionRowColumn[]>(
    () => [
      { key: 'id', className: 'pl-4' },
      { key: 'account' },
      { key: 'amount' },
      { key: 'category' },
      { key: 'executedAt' },
      { key: 'note', className: 'text-muted-foreground' },
      { key: 'actions', className: 'text-right' },
    ],
    [],
  );

  return (
    <div>
      <Table className="min-w-[920px] table-fixed">
        <colgroup>
          <col className="w-4" />
          <col className="w-24" />
          <col className="w-[260px]" />
          <col className="w-52" />
          <col className="w-40" />
          <col className="w-20" />
          <col />
          <col className="w-28" />
        </colgroup>
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead />
            <TableHead>ID</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        {dates.map((date) => {
          const group = groupedItems?.find((g) => g.date.isSame(date, 'day'));
          const items = group?.items ?? [];
          const transactionsValue = group?.transactionsValue ?? 0;
          const transfersValue = group?.transfersValue ?? 0;
          const transactionsCount = group?.transactionsCount ?? 0;
          const transfersCount = group?.transfersCount ?? 0;

          if (!showEmptyDays && items.length === 0) return null;

          return (
            <tbody key={date.format(BACKEND_DATE_FORMAT)}>
              <DateGroupHeaderRow
                left={
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
                }
                right={
                  <>
                    {transactionsCount > 0 && (
                      <SummaryBadge count={transactionsCount} icon={FileText} value={transactionsValue} />
                    )}
                    {transfersCount > 0 && (
                      <SummaryBadge
                        count={transfersCount}
                        icon={ArrowLeftRight}
                        useColors={false}
                        value={transfersValue}
                      />
                    )}
                  </>
                }
                rowClassName="bg-muted/30"
              />

              {sortItems(items, isReversedOrder).map((item) => {
                if (item instanceof Transfer || 'fromExpense' in (item as object)) {
                  const transfer = item as Transfer;
                  const isSelected = selectedKey === itemKey(transfer);
                  return (
                    <TransferRow
                      renderDetails={(transferItem) => <TransferDetails transfer={transferItem} />}
                      sheetOpen={openSheetId === transfer.id}
                      transfer={transfer}
                      className={cn({ 'bg-accent/50': isSelected })}
                      key={`transfer-${transfer.id}`}
                      onDelete={(transferItem) => handleDelete(transferItem)}
                      onEdit={(transferItem) => openForm(FormType.Transfer, transferItem)}
                      onRowClick={() => onSelectItem?.(transfer)}
                      onSheetOpenChange={(open) => setOpenSheetId(open ? transfer.id : null)}
                    />
                  );
                }

                const transaction = item as Transaction;
                const isSelected = selectedKey === itemKey(transaction);
                return (
                  <TransactionRow
                    columns={transactionColumns}
                    inlineEdit={inlineEdit}
                    renderDetails={(transactionItem) => <TransactionDetails transaction={transactionItem} />}
                    sheetOpen={openSheetId === transaction.id}
                    transaction={transaction}
                    className={cn('text-xs', { 'bg-accent/50': isSelected })}
                    key={`transaction-${transaction.id}`}
                    onDelete={(transactionItem) => handleDelete(transactionItem)}
                    onOpenForm={(transactionItem) => openForm(FormType.Transaction, transactionItem)}
                    onRowClick={() => onSelectItem?.(transaction)}
                    onSheetOpenChange={(open) => setOpenSheetId(open ? transaction.id : null)}
                    onToggleDraft={toggleDraft}
                  />
                );
              })}
            </tbody>
          );
        })}
      </Table>
    </div>
  );
};

TableListing.displayName = 'TransactionAndTransfersTableListing';

export default TableListing;
