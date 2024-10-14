import { Check, Pencil, X, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

import { confirm } from '@/utils/confirmation';
import { useTransactionMutations } from '@/hooks/useTransactionMutations';
import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import TransactionValue from '@/components/common/TransactionValue';
import AccountBadge from '@/components/features/accounts/Badge';
import Details from '@/components/features/transactions/Details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import Transaction from '@/models/Transaction';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  groupedTransactions: [string, Transaction[]][];
}

type EditableField = 'account' | 'amount' | 'category' | 'note' | 'executedAt';

export const DesktopTable: React.FC<Props> = ({ groupedTransactions, ...props }) => {
  const { updateTransaction, deleteTransaction, isUpdating } = useTransactionMutations();
  const { openForm } = useFormContext();
  const baseCurrency = useBaseCurrency();
  const [editingCell, setEditingCell] = useState<{ transactionId: number; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const calculateTotalValue = (transactions: Transaction[]) => transactions
    .filter(t => !t.isTransfer())
    .reduce((total, transaction) => {
      const value = transaction.isIncome() ? transaction.convertedValues[baseCurrency] : -transaction.convertedValues[baseCurrency];
      return total + value;
    }, 0);

  const handleEdit = (transactionId: number, field: EditableField, value: string) => {
    setEditingCell({ transactionId, field });
    setEditValue(value);
  };

  const handleSave = useCallback(async (transaction: Transaction) => {
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
        originalTransaction: transaction
      });
      toast.success('Transaction updated successfully');
    } catch (error) {
      console.error('Form submission failed:', error);
      toast.error('Failed to submit transaction. Issue requires investigation.');
    }

    setEditingCell(null);
  }, [editingCell, editValue, updateTransaction]);

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
    [handleCancel, handleSave]
  );

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

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
              onChange={v => setEditValue(v)}
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
              multiple={false}
              disabled={isUpdating}
              type={transaction.type}
              value={editValue?.id || editValue}
              onChange={v => setEditValue(v)}
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
              value={moment(editValue as string).format('YYYY-MM-DDTHH:mm')}
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
        {groupedTransactions.map(([date, transactions]) => (
          <React.Fragment key={date}>
            <TableRow>
              <TableCell colSpan={8} className="font-semibold bg-muted">
                <div className="flex justify-between items-center">
                  <RelativeDatetimeDisplay showTime={false} date={moment(date)} />
                  <div className="text-sm font-normal">
                    <span className="mr-4">{transactions.length} transactions</span>
                    <span>
                      Total: <MoneyValue className="font-medium font-mono" amount={calculateTotalValue(transactions)} />
                    </span>
                  </div>
                </div>
              </TableCell>
            </TableRow>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell></TableCell>
                <TableCell>
                  <Sheet>
                    <SheetTrigger className="m-0 cursor-help" asChild>
                      <code>#{transaction.id}</code>
                    </SheetTrigger>
                    <SheetContent className="max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                      <SheetHeader>
                        <SheetTitle>Transaction Details</SheetTitle>
                      </SheetHeader>
                      <Details transaction={transaction} />
                    </SheetContent>
                  </Sheet>
                </TableCell>
                <TableCell>
                  {renderEditableCell(transaction, 'account', <AccountBadge size="sm" account={transaction.account} />)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(transaction, 'amount', <TransactionValue transaction={transaction} />)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(transaction, 'category',
                    <Badge variant="outline" className="text-xs px-1 py-0 whitespace-nowrap bg-background shadow-md">
                      {transaction.category.name}
                    </Badge>,
                  )}
                </TableCell>
                <TableCell>
                  {renderEditableCell(transaction, 'note', transaction.note)}
                </TableCell>
                <TableCell>{renderEditableCell(transaction, 'executedAt', transaction.executedAt.format(MOMENT_TIME_VIEW_FORMAT))}</TableCell>
                <TableCell>
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

interface SkeletonProps extends React.ComponentPropsWithoutRef<'div'> {
  rowsPerGroup?: number;
  numberOfGroups?: number;
}

export const DesktopTableSkeleton: React.FC<SkeletonProps> = ({ rowsPerGroup = 3, numberOfGroups = 2, ...props }) => {
  const renderSkeletonGroup = (groupIndex: number) => (
    <React.Fragment key={groupIndex}>
      <TableRow>
        <TableCell colSpan={8} className="bg-muted">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </TableCell>
      </TableRow>
      {[...Array(rowsPerGroup)].map((_, rowIndex) => (
        <TableRow key={`${groupIndex}-${rowIndex}`}>
          <TableCell />
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell>
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-6 w-6 " />
              <Skeleton className="h-6 w-6" />
            </div>
          </TableCell>
        </TableRow>
        ))}
    </React.Fragment>
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
        {[...Array(numberOfGroups)].map((_, index) => renderSkeletonGroup(index))}
      </TableBody>
    </Table>
  );
};


export default DesktopTable;
