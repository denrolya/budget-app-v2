import { Eye, Pencil, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useId, useMemo } from 'react';

import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import CategoryTypeahead from '@/features/categories/components/CategoryTypeahead';
import TransactionValue from '@/components/common/TransactionValue';
import AccountPill from '@/features/accounts/components/Pill';
import EditableCell from '@/features/transactions/components/EditableCell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TableCell, TableRow } from '@/components/ui/table';
import { MOMENT_DATETIME_FORM_FORMAT, MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';
import Transaction from '@/models/Transaction';
import { TransactionEditableField, useInlineTransactionEdit } from '@/hooks/useInlineTransactionEdit';

export type TransactionRowColumn =
  | { key: 'id'; className?: string }
  | { key: 'account'; className?: string }
  | { key: 'amount'; className?: string }
  | { key: 'category'; className?: string }
  | { key: 'note'; className?: string }
  | { key: 'executedAt'; className?: string }
  | { key: 'actions'; className?: string };

type Props = {
  transaction: Transaction;
  compact?: boolean;
  columns: TransactionRowColumn[];
  renderDetails: (tx: Transaction) => React.ReactNode;
  onOpenForm: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onToggleDraft?: (tx: Transaction) => void;
  inlineEdit: ReturnType<typeof useInlineTransactionEdit>;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  className?: string;
};

export const ListingRow = ({
                             transaction,
                             compact = true,
                             columns,
                             renderDetails,
                             onOpenForm,
                             onDelete,
                             onToggleDraft,
                             inlineEdit,
                             sheetOpen,
                             onSheetOpenChange,
                             className,
                           }: Props) => {
  const titleId = useId();
  const descId = useId();

  const { isEditing, startEdit, cancelEdit, save, editValue, setEditValue, keyHandler } = inlineEdit;

  const disabled = false;

  const cellClass = (extra?: string) => cn(compact ? 'py-0' : undefined, extra);

  const renderEditable = (field: TransactionEditableField, display: React.ReactNode, editor: React.ReactNode) => (
    <EditableCell
      compact={compact}
      disabled={disabled}
      isEditing={isEditing(transaction.id, field)}
      display={display}
      editor={editor}
      onStartEdit={() => startEdit(transaction, field)}
      onCancel={cancelEdit}
      onSave={() => void save(transaction)}
    />
  );

  const idCell = (
    <div className="flex items-center min-w-0">
      <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="text-left"
            aria-label={`Open transaction #${transaction.id} details`}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen ? true : false}
          >
            <code className="cursor-context-menu tracking-tighter antialiased select-all text-muted-foreground">
              #{transaction.id}
            </code>
          </button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="p-0 overflow-y-auto w-full sm:max-w-xl"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <div className="h-full flex flex-col">
            <SheetHeader className="p-6 pb-0">
              <SheetTitle id={titleId} className="tracking-tight text-xl font-bold">
                Transaction Details
              </SheetTitle>
              <SheetDescription id={descId} className="flex justify-between items-center">
                <span>
                  ID: <code className="text-muted-foreground">#{transaction.id}</code>
                </span>
              </SheetDescription>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto p-6">{renderDetails(transaction)}</div>
          </div>
        </SheetContent>
      </Sheet>

      {transaction.isDraft && onToggleDraft && (
        <Badge
          variant="outline"
          className="ml-2 bg-warning text-warning-foreground border-warning cursor-pointer hover:bg-warning/80"
          onClick={() => onToggleDraft(transaction)}
        >
          Draft
        </Badge>
      )}
    </div>
  );

  const accountCell = renderEditable(
    'account',
    <AccountPill size="sm" variant="inline" account={transaction.account} />,
    <AccountTypeahead
      autoFocus
      multiple={false}
      value={((editValue as any)?.id ?? editValue) as any}
      onChange={(v) => setEditValue(v as any)}
      onKeyDown={(e) => keyHandler.onKeyDown(e, transaction)}
    />,
  );

  // Keep amount visually as the primary numeric accent
  const amountCell = renderEditable(
    'amount',
    <TransactionValue revert className="font-semibold tracking-tight" transaction={transaction} />,
    <Input
      autoFocus
      type="number"
      value={String(editValue ?? '')}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={(e) => keyHandler.onKeyDown(e, transaction)}
    />,
  );

  const categoryCell = renderEditable(
    'category',
    <Badge variant="outline" className="px-1 py-0 whitespace-nowrap bg-background shadow-md">
      {transaction.category.name}
    </Badge>,
    <CategoryTypeahead
      autoFocus
      valueField="id"
      multiple={false}
      type={transaction.type}
      value={((editValue as any)?.id ?? editValue) as any}
      onChange={(v) => setEditValue(v as any)}
      onKeyDown={(e) => keyHandler.onKeyDown(e, transaction)}
    />,
  );

  const noteCell = renderEditable(
    'note',
    <span className="text-muted-foreground truncate">{transaction.note}</span>,
    <Input
      autoFocus
      value={String(editValue ?? '')}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={(e) => keyHandler.onKeyDown(e, transaction)}
    />,
  );

  const executedAtCell = renderEditable(
    'executedAt',
    <span className="whitespace-nowrap tabular-nums">{transaction.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}</span>,
    <Input
      autoFocus
      type="datetime-local"
      value={moment(editValue as any).format(MOMENT_DATETIME_FORM_FORMAT)}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={(e) => keyHandler.onKeyDown(e, transaction)}
    />,
  );

  const actionsCell = (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`View transaction #${transaction.id} details`}
        className="h-8 w-8 p-0"
        onClick={() => onSheetOpenChange?.(true)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit transaction #${transaction.id}`}
        className="h-8 w-8 p-0"
        onClick={() => onOpenForm(transaction)}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remove transaction #${transaction.id}`}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onDelete(transaction)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const cellsByKey: Record<TransactionRowColumn['key'], React.ReactNode> = {
    id: idCell,
    account: accountCell,
    amount: amountCell,
    category: categoryCell,
    note: noteCell,
    executedAt: executedAtCell,
    actions: actionsCell,
  };

  const normalizedColumns = useMemo(() => columns, [columns]);

  return (
    <TableRow
      className={cn(
        'text-xs',
        transaction.isDraft ? 'bg-warning/20 hover:bg-warning/30' : 'hover:bg-muted/50',
        className,
      )}
    >
      {/* gutter cell */}
      <TableCell className={cellClass('w-4')} />

      {normalizedColumns.map((c, idx) => (
        <TableCell key={`${c.key}-${idx}`} className={cellClass(c.className)}>
          {cellsByKey[c.key]}
        </TableCell>
      ))}
    </TableRow>
  );
};

ListingRow.displayName = 'TransactionListingRow';

export default ListingRow;
