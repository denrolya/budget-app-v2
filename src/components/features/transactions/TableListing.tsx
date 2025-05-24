import cn from 'classnames';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import TransactionValue from '@/components/common/TransactionValue';
import AccountBadge from '@/components/features/accounts/Badge';
import Details from '@/components/features/transactions/Details';
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
import { confirm } from '@/utils/confirmation';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  compact?: boolean;
  groupedItems: [Moment, Transaction[], number, number][];
}

type EditableField = 'account' | 'amount' | 'category' | 'note' | 'executedAt';

export const TableListing: React.FC<Props> = ({ compact = true, groupedItems, ...props }) => {
  const { updateTransaction, deleteTransaction, isUpdating } = useTransactionMutations();
  const { openForm } = useFormContext();
  const [editingCell, setEditingCell] = useState<{ transactionId: number; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (transactionId: number, field: EditableField, value: string) => {
    setEditingCell({ transactionId, field });
    setEditValue(value);
  };

  const handleSave = useCallback(
    async (transaction: Transaction) => {
      if (!editingCell) return;

      const updatedTransaction = { ...transaction };

      switch (editingCell.field) {
        case 'account':
          updatedTransaction.account = editValue || transaction.account;
          break;
        case 'amount':
          updatedTransaction.amount = parseFloat(editValue as string);
          break;
        case 'category':
          updatedTransaction.category = editValue || transaction.category;
          break;
        case 'note':
          updatedTransaction.note = editValue as string;
          break;
        case 'executedAt':
          updatedTransaction.executedAt = moment(editValue as string);
          break;
      }

      try {
        await updateTransaction({
          id: transaction.id,
          updates: updatedTransaction,
          originalTransaction: transaction,
        });
        toast.success('Transaction updated successfully');
      } catch (error) {
        console.error('Form submission failed:', error);
        toast.error('Failed to submit transaction. Issue requires investigation.');
      }

      setEditingCell(null);
    },
    [editingCell, editValue, updateTransaction],
  );

  const handleCancel = useCallback(() => {
    setEditingCell(null);
  }, [setEditingCell]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, transaction: Transaction) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave(transaction);
      }
    },
    [handleCancel, handleSave],
  );

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

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

  const renderEditableCell = (transaction: Transaction, field: EditableField, content: React.ReactNode) => {
    const isEditing = editingCell?.transactionId === transaction.id && editingCell?.field === field;

    if (isEditing) {
      let inputElement;

      switch (field) {
        case 'account':
          inputElement = (
            <AccountTypeahead
              autoFocus
              multiple={false}
              disabled={isUpdating}
              value={editValue?.id || editValue}
              onChange={(v) => setEditValue(v)}
              onKeyDown={(e) => handleKeyDown(e, transaction)}
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
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, transaction)}
            />
          );
          break;
        case 'category':
          inputElement = (
            <CategoryTypeahead
              autoFocus
              valueField="id"
              multiple={false}
              disabled={isUpdating}
              type={transaction.type}
              value={editValue?.id || editValue}
              onChange={(v) => setEditValue(v)}
              onKeyDown={(e) => handleKeyDown(e, transaction)}
            />
          );
          break;
        case 'executedAt':
          inputElement = (
            <Input
              autoFocus
              type="datetime-local"
              disabled={isUpdating}
              value={moment(editValue as string).format(MOMENT_DATETIME_FORM_FORMAT)}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, transaction)}
            />
          );
          break;
        default:
          inputElement = (
            <Input
              autoFocus
              disabled={isUpdating}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, transaction)}
            />
          );
      }

      return (
        <div className="flex items-center space-x-2">
          <div className="flex-grow">{inputElement}</div>
          <div className="flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => handleSave(transaction)} className="h-8 w-8 p-0">
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
        onClick={() => handleEdit(transaction.id, field, transaction[field] as string)}
      >
        {content}
      </div>
    );
  };

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
                  <RelativeDatetimeDisplay showDayBadge badgeSize="sm" variant="default" showTime={false} date={date} />
                  <SummaryBadge icon={ROUTES.TRANSACTION_LIST.icon} count={count} value={totalValue} />
                </div>
              </TableCell>
            </TableRow>
            {transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className={cn( 'text-xs', {
                  'bg-warning/20 hover:bg-warning/30': transaction.isDraft,
                  'hover:bg-muted/50': !transaction.isDraft,
                })}
              >
                <TableCell
                  colSpan={2}
                  className={cn('pl-4', 'w-[1%]', {
                    'py-0': compact,
                  })}
                >
                  <Sheet>
                    <SheetTrigger className="m-0" asChild>
                      <code className="cursor-context-menu tracking-tighter antialiased select-all text-muted-foreground">
                        #{transaction.id}
                      </code>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
                      <div className="h-full flex flex-col">
                        <SheetHeader className="p-6 pb-0">
                          <SheetTitle>Transaction Details</SheetTitle>
                          <SheetDescription className="flex justify-between items-center">
                            <span>
                              ID: <code className="text-muted-foreground">#{transaction.id}</code>
                            </span>
                          </SheetDescription>
                        </SheetHeader>
                        <div className="flex-grow overflow-y-auto p-6">
                          <Details transaction={transaction} />
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                  {transaction.isDraft && (
                    <Badge
                      variant="outline"
                      className="ml-2 bg-warning text-warning-foreground border-warning cursor-pointer hover:bg-warning/80"
                      onClick={() => toggleDraft(transaction)}
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
                  {renderEditableCell(
                    transaction,
                    'category',
                    <Badge variant="outline" className="px-1 py-0 whitespace-nowrap bg-background shadow-md">
                      {transaction.category.name}
                    </Badge>,
                  )}
                </TableCell>
                <TableCell
                  className={cn({
                    'py-0': compact,
                  })}
                >
                  {renderEditableCell(
                    transaction,
                    'amount',
                    <TransactionValue revert className="font-semibold" transaction={transaction} />,
                  )}
                </TableCell>
                <TableCell
                  className={cn({
                    'py-0': compact,
                  })}
                >
                  {renderEditableCell(transaction, 'account', <AccountBadge size="sm" account={transaction.account} />)}
                </TableCell>
                <TableCell
                  className={cn('text-muted-foreground', {
                    'py-0': compact,
                  })}
                >
                  {renderEditableCell(transaction, 'note', transaction.note)}
                </TableCell>
                <TableCell
                  className={cn({
                    'py-0': compact,
                  })}
                >
                  {renderEditableCell(
                    transaction,
                    'executedAt',
                    transaction.executedAt.format(MOMENT_TIME_VIEW_FORMAT),
                  )}
                </TableCell>
                <TableCell
                  className={cn({
                    'py-0': compact,
                  })}
                >
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="View Details"
                      className="h-8 w-8 p-0"
                      onClick={() => openForm(FormType.Transaction, transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove Transaction"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(transaction)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};

TableListing.displayName = 'TransactionsTableListing';

export default TableListing;
