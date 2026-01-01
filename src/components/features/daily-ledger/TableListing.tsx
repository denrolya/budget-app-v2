import { ArrowRight, Check, Eye, Pencil, Trash2, X } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import TransactionValue from '@/components/common/TransactionValue';
import AccountPill from '@/components/features/accounts/Pill';
import TransactionDetails from '@/components/features/transactions/Details';
import TransferDetails from '@/components/features/transfers/Details';
import RateDisplay from '@/components/features/transfers/RateDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT, MOMENT_DATETIME_FORM_FORMAT, MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactionMutations } from '@/hooks/useTransactionMutations';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';
import { confirm } from '@/utils/confirmation';

type EditableField = 'account' | 'amount' | 'category' | 'note' | 'executedAt';

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
  const [editingCell, setEditingCell] = useState<{ itemId: number; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [openSheetId, setOpenSheetId] = useState<number | null>(null);

  const handleEdit = (itemId: number, field: EditableField, value: string) => {
    setEditingCell({ itemId, field });
    setEditValue(value);
  };

  const handleSave = useCallback(
    async (item: Transaction) => {
      if (!editingCell || !('id' in item)) return;

      const updatedItem = { ...item };

      switch (editingCell.field) {
        case 'account':
          updatedItem.account = editValue || item.account;
          break;
        case 'amount':
          updatedItem.amount = parseFloat(editValue as string);
          break;
        case 'category':
          if ('category' in updatedItem) {
            updatedItem.category = editValue || item.category;
          }
          break;
        case 'note':
          updatedItem.note = editValue as string;
          break;
        case 'executedAt':
          updatedItem.executedAt = moment(editValue as string);
          break;
      }

      try {
        await updateTransaction({
          id: Number(item.id),
          updates: updatedItem,
          originalTransaction: item as Transaction,
        });
        toast.success('Item updated successfully');
      } catch (error) {
        console.error('Form submission failed:', error);
        toast.error('Failed to submit item. Issue requires investigation.');
      }

      setEditingCell(null);
    },
    [editingCell, editValue, updateTransaction],
  );

  const handleCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleDelete = async (item: Transaction | Transfer) => {
    const itemType = 'fromExpense' in item ? 'transfer' : 'transaction';
    const confirmed = await confirm({
      title: 'Are you absolutely sure?',
      description: `You are about to delete ${itemType} #${item.id}. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      if ('fromExpense' in item) {
        // Handle transfer deletion
        console.log('Delete transfer:', item.id);
      } else {
        deleteTransaction(Number(item.id));
      }
    }
  };

  const toggleSheet = (itemId: number) => {
    setOpenSheetId((prevId) => (prevId === itemId ? null : itemId));
  };

  const renderEditableCell = (item: Transaction, field: EditableField, content: React.ReactNode) => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.field === field;

    if (!isEditing) {
      return (
        <div
          className="cursor-pointer hover:bg-muted p-1 rounded transition-colors"
          onClick={() => handleEdit(Number(item.id), field, item[field] as string)}
        >
          {content}
        </div>
      );
    }
    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave(item);
      if (e.key === 'Escape') handleCancel();
    };
    let inputElement;

    switch (field) {
      case 'account':
        inputElement = (
          <AccountTypeahead
            autoFocus
            multiple={false}
            disabled={isUpdating}
            value={editValue?.id || editValue}
            onKeyDown={onKeyDown}
            onChange={(v) => setEditValue(v)}
          />
        );
        break;
      case 'amount':
        inputElement = (
          <Input
            autoFocus
            type="number"
            disabled={isUpdating}
            value={editValue}
            onKeyDown={onKeyDown}
            onChange={(e) => setEditValue(e.target.value)}
          />
        );
        break;
      case 'category':
        if ('category' in item) {
          inputElement = (
            <CategoryTypeahead
              autoFocus
              valueField="id"
              multiple={false}
              disabled={isUpdating}
              type={item.type}
              value={editValue?.id || editValue}
              onKeyDown={onKeyDown}
              onChange={(v) => setEditValue(v)}
            />
          );
        }
        break;
      case 'executedAt':
        inputElement = (
          <Input
            autoFocus
            type="datetime-local"
            disabled={isUpdating}
            value={moment(editValue as string).format(MOMENT_DATETIME_FORM_FORMAT)}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={onKeyDown}
          />
        );
        break;
      default:
        inputElement = (
          <Input
            autoFocus
            disabled={isUpdating}
            value={editValue}
            onKeyDown={onKeyDown}
            onChange={(e) => setEditValue(e.target.value)}
          />
        );
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="flex-grow">{inputElement}</div>
        <div className="flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => handleSave(item)} className="h-8 w-8 p-0">
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const dates = useMemo(() => {
    const dates = [];
    const currentDate = after.clone();
    while (currentDate.isSameOrBefore(before)) {
      dates.push(currentDate.clone());
      currentDate.add(1, 'day');
    }
    return isReversedOrder ? dates.reverse() : dates;
  }, [after, before, isReversedOrder]);

  const toggleDraft = async (transaction: Transaction) => {
    const confirmed = await confirm({
      title: 'Are you sure you want to unmark this transaction as draft?',
      description: `This will unmark transaction #${transaction.id} as not draft.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    });

    if (confirmed) {
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
    }
  };

  const renderTransferAmounts = (transfer: Transfer) => (
    <>
      <div className="flex flex-row items-center">
        <MoneyValue
          className="font-semibold tracking-tighter"
          amount={-transfer.fromExpense.amount}
          currency={transfer.fromExpense.account.currency}
        />
        <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
        <MoneyValue
          className="font-semibold tracking-tighter"
          amount={transfer.toIncome.amount}
          currency={transfer.toIncome.account.currency}
        />
      </div>
      <div className="text-muted-foreground">
        {transfer.feeExpense && (
          <small className="flex items-center">
            <span className="mr-1">Fee:</span>
            <MoneyValue amount={-transfer.feeExpense.amount} currency={transfer.feeExpense.account.currency} />
          </small>
        )}
      </div>
    </>
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
            const [, items, transactionsValue, transfersValue, transactionsCount, transfersCount] = groupedItems?.find(
              (group) => group[0].isSame(date, 'day'),
            ) || [null, [], 0, 0, 0, 0];

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
                          className="font-normal"
                          badgeSize="sm"
                          variant="default"
                          showTime={false}
                          date={date}
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <SummaryBadge
                          icon={ROUTES.TRANSACTION_LIST.icon}
                          count={transactionsCount}
                          value={transactionsValue}
                        />
                        <SummaryBadge
                          useColors={false}
                          icon={ROUTES.TRANSFER_LIST.icon}
                          count={transfersCount}
                          value={transfersValue}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn('text-xs', {
                      'bg-warning/20 hover:bg-warning/30': item instanceof Transaction && item.isDraft,
                    })}
                  >
                    <TableCell
                      colSpan={2}
                      className={cn('pl-4', 'w-[1%]', {
                        'py-0': compact,
                      })}
                    >
                      <Sheet
                        open={openSheetId === item.id}
                        onOpenChange={(open) => setOpenSheetId(open ? Number(item.id) : null)}
                      >
                        <SheetTrigger asChild>
                          <code className="cursor-context-menu tracking-tighter antialiased select-all">
                            #{item.id}
                          </code>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 overflow-y-auto">
                          <div className="h-full flex flex-col">
                            <SheetHeader className="p-6 pb-0">
                              <SheetTitle className="tracking-tight text-xl font-bold">
                                {'fromExpense' in item ? 'Transfer' : 'Transaction'} Details
                              </SheetTitle>
                              <SheetDescription className="flex justify-between items-center">
                                <span>
                                  ID: <code className="text-muted-foreground">#{item.id}</code>
                                </span>
                              </SheetDescription>
                            </SheetHeader>
                            <div className="flex-grow overflow-y-auto p-6">
                              {'fromExpense' in item ? (
                                <TransferDetails transfer={item} />
                              ) : (
                                <TransactionDetails transaction={item} />
                              )}
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                      {item instanceof Transaction && item.isDraft && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-warning text-warning-foreground border-warning cursor-pointer hover:bg-warning/80"
                          onClick={() => toggleDraft(item)}
                        >
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn({
                        'py-0': compact,
                      })}
                    >
                      {item instanceof Transfer && (
                        <div className="flex items-center space-x-2">
                          <AccountPill
                            size="sm"
                            account={item.fromExpense.account}
                            className={cn({
                              'ring-2 ring-destructive': item.feeExpense?.account.id === item.fromExpense.account.id,
                            })}
                          />
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <AccountPill
                            size="sm"
                            account={item.toIncome.account}
                            className={cn({
                              'ring-2 ring-destructive': item.feeExpense?.account.id === item.toIncome.account.id,
                            })}
                          />
                        </div>
                      )}
                      {item instanceof Transaction &&
                        renderEditableCell(item, 'account', <AccountPill size="sm" account={item.account} />)}
                    </TableCell>
                    <TableCell
                      className={cn({
                        'py-0': compact,
                      })}
                    >
                      {'fromExpense' in item ? (
                        <div>{renderTransferAmounts(item)}</div>
                      ) : (
                        renderEditableCell(
                          item,
                          'amount',
                          <TransactionValue revert className="font-semibold" transaction={item} />,
                        )
                      )}
                    </TableCell>
                    <TableCell
                      className={cn({
                        'py-0': compact,
                      })}
                    >
                      {item instanceof Transaction &&
                        renderEditableCell(
                          item,
                          'category',
                          <Badge
                            variant="outline"
                            className="px-1 py-0 whitespace-nowrap bg-background shadow-md"
                          >
                            {item.category.name}
                          </Badge>,
                        )}
                      {item instanceof Transfer && (
                        <>
                          <RateDisplay transfer={item} />
                          <small className="flex text-muted-foreground">
                            <span>Rate: {Number(item.rate.toFixed(4))}</span>
                          </small>
                        </>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn('text-muted-foreground', {
                        'py-0': compact,
                      })}
                    >
                      {item instanceof Transaction ? renderEditableCell(item, 'note', item.note) : item.note}
                    </TableCell>
                    <TableCell
                      className={cn({
                        'py-0': compact,
                      })}
                    >
                      {item instanceof Transaction
                        ? renderEditableCell(item, 'executedAt', item.executedAt.format(MOMENT_TIME_VIEW_FORMAT))
                        : item.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}
                    </TableCell>
                    <TableCell
                      className={cn('text-right', {
                        'py-0': compact,
                      })}
                    >
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View Details"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleSheet(Number(item.id))}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {'fromExpense' in item ? null : (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit Item"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              openForm('fromExpense' in item ? FormType.Transfer : FormType.Transaction, item)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove Item"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
