import { ArrowRight, Check, Eye, Pencil, Trash2, X } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import TransactionValue from '@/components/common/TransactionValue';
import AccountBadge from '@/components/features/accounts/Badge';
import TransactionDetails from '@/components/features/transactions/Details';
import TransferDetails from '@/components/features/transfers/Details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT, MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactionMutations } from '@/hooks/useTransactionMutations';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';
import { confirm } from '@/utils/confirmation';

type EditableField = 'account' | 'amount' | 'category' | 'note' | 'executedAt'

interface Props {
  isLoading: boolean;
  groupedItems: [Moment, (Transaction | Transfer)[], number, number, number, number][];
  startDate: Moment;
  endDate: Moment;
}

const TableListing: React.FC<Props> = ({ isLoading, groupedItems, startDate, endDate }) => {
  const { updateTransaction, deleteTransaction, isUpdating } = useTransactionMutations();
  const { openForm } = useFormContext();
  const [editingCell, setEditingCell] = useState<{ itemId: number; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [openSheetId, setOpenSheetId] = useState<number | null>(null);

  const handleEdit = (itemId: number, field: EditableField, value: string) => {
    setEditingCell({ itemId, field });
    setEditValue(value);
  };

  const handleSave = useCallback(async (item: Transaction | Transfer) => {
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
        id: item.id,
        updates: updatedItem,
        originalTransaction: item as Transaction,
      });
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Form submission failed:', error);
      toast.error('Failed to submit item. Issue requires investigation.');
    }

    setEditingCell(null);
  }, [editingCell, editValue, updateTransaction]);

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
        deleteTransaction(item.id);
      }
    }
  };

  const toggleSheet = (itemId: number) => {
    setOpenSheetId(prevId => prevId === itemId ? null : itemId);
  };

  const renderEditableCell = (item: Transaction | Transfer, field: EditableField, content: React.ReactNode) => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.field === field;

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave(item);
                if (e.key === 'Escape') handleCancel();
              }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave(item);
                if (e.key === 'Escape') handleCancel();
              }}
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
                onChange={v => setEditValue(v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave(item);
                  if (e.key === 'Escape') handleCancel();
                }}
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
              value={moment(editValue as string).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave(item);
                if (e.key === 'Escape') handleCancel();
              }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave(item);
                if (e.key === 'Escape') handleCancel();
              }}
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
    }

    return (
      <div
        className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
        onClick={() => handleEdit(item.id, field, item[field] as string)}
      >
        {content}
      </div>
    );
  };

  const dates = useMemo(() => {
    const dates = [];
    const currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate)) {
      dates.push(currentDate.clone());
      currentDate.add(1, 'day');
    }
    return dates.reverse();
  }, [startDate, endDate]);

  const renderTransferAmounts = (transfer: Transfer) => (
    <>
      <div className="flex flex-row items-center">
        <MoneyValue
          amount={-transfer.fromExpense.amount}
          currency={transfer.fromExpense.account.currency}
        />
        <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
        <MoneyValue
          amount={transfer.toIncome.amount}
          currency={transfer.toIncome.account.currency}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {transfer.feeExpense && (
          <div className="flex items-center">
            <span className="mr-1">Fee:</span>
            <MoneyValue
              amount={-transfer.feeExpense.amount}
              currency={transfer.feeExpense.account.currency}
            />
          </div>
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
            const [, items, transactionsValue, transfersValue, transactionsCount, transfersCount] = groupedItems?.find((group) => group[0].isSame(date, 'day')) || [null, [], 0, 0, 0, 0];

            return (
              <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
                <TableRow>
                  <TableCell colSpan={8} className="font-semibold bg-muted">
                    <div className="flex flex-wrap justify-between items-center">
                      <RelativeDatetimeDisplay showTime={false} date={date} />
                      <div className="text-sm font-normal">
                        <span className="mr-4">{transactionsCount} transactions, {transfersCount} transfers</span>
                        <span>
                          Transactions: <MoneyValue className="font-medium font-mono" amount={transactionsValue} />
                        </span>
                        <span className="ml-2">
                          Transfers: <MoneyValue className="font-medium font-mono" amount={transfersValue} />
                        </span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No transactions or transfers for this day.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="w-4"></TableCell>
                    <TableCell>
                      <Sheet
                        open={openSheetId === item.id}
                        onOpenChange={(open) => setOpenSheetId(open ? item.id : null)}>
                        <SheetTrigger asChild>
                          <code className="cursor-help" onClick={() => toggleSheet(item.id)}>#{item.id}</code>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 overflow-y-auto">
                          <div className="h-full flex flex-col">
                            <SheetHeader className="p-6 pb-0">
                              <SheetTitle>{('fromExpense' in item) ? 'Transfer' : 'Transaction'} Details</SheetTitle>
                              <SheetDescription className="sr-only">
                                Detailed information
                                about {('fromExpense' in item) ? 'transfer' : 'transaction'} #{item.id}
                              </SheetDescription>
                            </SheetHeader>
                            <div className="flex-grow overflow-y-auto p-6">
                              {'fromExpense' in item ? <TransferDetails transfer={item} /> :
                                <TransactionDetails transaction={item} />}
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                    <TableCell>
                      {'fromExpense' in item ? (
                        <div className="flex items-center space-x-2">
                          <AccountBadge
                            size="sm"
                            account={item.fromExpense.account}
                            className={item.feeExpense?.account.id === item.fromExpense.account.id ? 'ring-2 ring-destructive' : ''}
                          />
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <AccountBadge
                            size="sm"
                            account={item.toIncome.account}
                            className={item.feeExpense?.account.id === item.toIncome.account.id ? 'ring-2 ring-destructive' : ''}
                          />
                        </div>
                      ) : (
                        renderEditableCell(item, 'account', <AccountBadge size="sm" account={item.account} />)
                      )}
                    </TableCell>
                    <TableCell>
                      {'fromExpense' in item ? (
                        <div>
                          {renderTransferAmounts(item)}
                        </div>
                      ) : (
                        renderEditableCell(item, 'amount', <TransactionValue transaction={item} />)
                      )}
                    </TableCell>
                    <TableCell>
                      {item instanceof Transfer && (
                        <>

                          <div>Rate: {Number(item.rate.toFixed(4))}</div>
                          <div className="text-xs text-muted-foreground">
                            1 {item.fromExpense.account.currency} = {Number(item.rate.toFixed(4))} {item.toIncome.account.currency}
                          </div>
                        </>
                      )}
                      {item instanceof Transaction && (
                        renderEditableCell(item, 'category',
                          <Badge variant="outline"
                                 className="text-xs px-1 py-0 whitespace-nowrap bg-background shadow-md">
                            {item.category.name}
                          </Badge>,
                        )
                      )}
                    </TableCell>
                    <TableCell>{renderEditableCell(item, 'note', item.note)}</TableCell>
                    <TableCell>{renderEditableCell(item, 'executedAt', item.executedAt.format(MOMENT_TIME_VIEW_FORMAT))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View Details"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleSheet(item.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {'fromExpense' in item ? null : (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit Item"
                            className="h-8 w-8 p-0"
                            onClick={() => openForm('fromExpense' in item ? FormType.Transfer : FormType.Transaction, item)}
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
