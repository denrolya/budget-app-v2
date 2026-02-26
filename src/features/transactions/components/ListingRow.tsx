import { Eye, Pencil, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useId, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TableCell, TableRow } from '@/components/ui/table';
import { MOMENT_DATETIME_FORM_FORMAT, MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import AccountPill from '@/features/accounts/components/Pill';
import CategoryTypeahead from '@/features/categories/components/CategoryTypeahead';
import { cn } from '@/lib/utils';
import { PopoverContent, PopoverTrigger, Popover } from '@/components/ui/popover';

import { TransactionEditableField, useInlineEdit } from '../hooks/useInlineEdit';
import Transaction from '../models/Transaction';

import EditableCell from './EditableCell';
import TransactionValue from './TransactionValue';

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
  inlineEdit: ReturnType<typeof useInlineEdit>;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  className?: string;
};

type CellRendererArgs = {
  tx: Transaction;
  compact: boolean;
  disabled: boolean;
  inlineEdit: ReturnType<typeof useInlineEdit>;
  onOpenForm: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onToggleDraft?: (tx: Transaction) => void;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  titleId: string;
  descId: string;
  renderDetails: (tx: Transaction) => React.ReactNode;
};

const Editable = (
  field: TransactionEditableField,
  display: React.ReactNode,
  editor: React.ReactNode,
  args: Pick<CellRendererArgs, 'tx' | 'compact' | 'disabled' | 'inlineEdit'>,
) => {
  const { tx, compact, disabled, inlineEdit } = args;
  const { isEditing, startEdit, cancelEdit, save } = inlineEdit;

  return (
    <EditableCell
      compact={compact}
      disabled={disabled}
      display={display}
      editor={editor}
      isEditing={isEditing(tx.id, field)}
      onCancel={cancelEdit}
      onSave={() => void save(tx)}
      onStartEdit={() => startEdit(tx, field)}
    />
  );
};

const cellClassName = (compact: boolean, extra?: string) =>
  cn('min-w-0 align-middle', compact ? 'py-0' : undefined, extra);

const IdCell = ({
  tx,
  onToggleDraft,
  sheetOpen,
  onSheetOpenChange,
  titleId,
  descId,
  renderDetails,
}: Pick<
  CellRendererArgs,
  'tx' | 'onToggleDraft' | 'sheetOpen' | 'onSheetOpenChange' | 'titleId' | 'descId' | 'renderDetails'
>) => (
  <div className="flex items-center min-w-0 gap-2">
    <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
      <SheetTrigger asChild>
        <button
          aria-expanded={sheetOpen}
          aria-haspopup="dialog"
          aria-label={`Open transaction #${tx.id} details`}
          type="button"
          className="min-w-0 w-[74px] text-left"
        >
          <code className="block min-w-0 truncate cursor-context-menu tracking-tighter antialiased select-all text-muted-foreground">
            #{tx.id}
          </code>
        </button>
      </SheetTrigger>

      <SheetContent
        aria-describedby={descId}
        aria-labelledby={titleId}
        side="right"
        className="p-0 overflow-y-auto w-full sm:max-w-xl"
      >
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle id={titleId} className="tracking-tight text-xl font-bold">
              Transaction Details
            </SheetTitle>
            <SheetDescription id={descId} className="flex justify-between items-center">
              <span>
                ID: <code className="text-muted-foreground">#{tx.id}</code>
              </span>
            </SheetDescription>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto p-6">{renderDetails(tx)}</div>
        </div>
      </SheetContent>
    </Sheet>

    {tx.isDraft && onToggleDraft ? (
      <Badge
        variant="outline"
        className="shrink-0 bg-warning text-warning-foreground border-warning cursor-pointer hover:bg-warning/80"
        onClick={() => onToggleDraft(tx)}
      >
        Draft
      </Badge>
    ) : null}
  </div>
);

const AccountCell = ({
  tx,
  compact,
  disabled,
  inlineEdit,
}: Pick<CellRendererArgs, 'tx' | 'compact' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, keyHandler } = inlineEdit;

  return Editable(
    'account',
    <div className="min-w-0 [&_*]:min-w-0">
      <AccountPill account={tx.account} size="sm" variant="inline" className="min-w-0" />
    </div>,
    <div className="min-w-0">
      <AccountTypeahead
        autoFocus
        multiple={false}
        value={((editValue as any)?.id ?? editValue) as any}
        onChange={(v) => setEditValue(v as any)}
        onKeyDown={(e) => keyHandler.onKeyDown(e, tx)}
      />
    </div>,
    { tx, compact, disabled, inlineEdit },
  );
};

const AmountCell = ({
  tx,
  compact,
  disabled,
  inlineEdit,
}: Pick<CellRendererArgs, 'tx' | 'compact' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, keyHandler } = inlineEdit;

  return Editable(
    'amount',
    <div className="min-w-0">
      <TransactionValue revert transaction={tx} className="font-semibold tracking-tight" />
    </div>,
    <Input
      autoFocus
      type="number"
      value={String(editValue ?? '')}
      className="min-w-0"
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={(e) => keyHandler.onKeyDown(e, tx)}
    />,
    { tx, compact, disabled, inlineEdit },
  );
};

const CategoryCell = ({
  tx,
  compact,
  disabled,
  inlineEdit,
}: Pick<CellRendererArgs, 'tx' | 'compact' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, keyHandler } = inlineEdit;

  return Editable(
    'category',
    <Badge variant="outline" className="max-w-full px-1 py-0 whitespace-nowrap bg-background shadow-md truncate">
      {tx.category.name}
    </Badge>,
    <div className="min-w-0">
      <CategoryTypeahead
        autoFocus
        multiple={false}
        type={tx.type}
        value={((editValue as any)?.id ?? editValue) as any}
        valueField="id"
        onChange={(v) => setEditValue(v as any)}
        onKeyDown={(e) => keyHandler.onKeyDown(e, tx)}
      />
    </div>,
    { tx, compact, disabled, inlineEdit },
  );
};

const NoteCell = ({
  tx,
  compact,
  disabled,
  inlineEdit,
}: Pick<CellRendererArgs, 'tx' | 'compact' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, keyHandler } = inlineEdit;

  const display = <span className="block min-w-0 truncate text-muted-foreground">{tx.note}</span>;

  const editor = (
    <Input
      autoFocus
      value={String(editValue ?? '')}
      className="min-w-0 w-full"
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={(e) => keyHandler.onKeyDown(e, tx)}
    />
  );

  return Editable('note', display, editor, { tx, compact, disabled, inlineEdit });
};

const ExecutedAtCell = ({
  tx,
  compact,
  disabled,
  inlineEdit,
}: Pick<CellRendererArgs, 'tx' | 'compact' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, save, cancelEdit, startEdit, keyHandler } = inlineEdit;
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    if (disabled) return;
    startEdit(tx, 'executedAt');
    setEditValue(tx.executedAt.toISOString()); // или то, что ты и так туда кладёшь
    setOpen(true);
  };

  const handleSave = () => {
    void save(tx);
    setOpen(false);
  };

  const handleCancel = () => {
    cancelEdit();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          handleCancel();
        } else {
          handleOpen();
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          type="button"
          className={cn(
            'w-full text-left whitespace-nowrap tabular-nums',
            compact ? 'py-0' : 'py-1',
            disabled ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-muted/50 rounded',
          )}
        >
          {tx.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto space-y-2"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
          }
        }}
      >
        <Input
          autoFocus
          type="datetime-local"
          value={moment(editValue as any).format(MOMENT_DATETIME_FORM_FORMAT)}
          onChange={(e) => setEditValue(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <Button size="sm" type="button" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" type="button" onClick={handleSave}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ActionsCell = ({
  tx,
  onOpenForm,
  onDelete,
  onSheetOpenChange,
}: Pick<CellRendererArgs, 'tx' | 'onOpenForm' | 'onDelete' | 'onSheetOpenChange'>) => (
  <div className="flex justify-end gap-2 shrink-0">
    <Button
      aria-label={`View transaction #${tx.id} details`}
      size="icon"
      variant="ghost"
      className="h-8 w-8 p-0"
      onClick={() => onSheetOpenChange?.(true)}
    >
      <Eye className="h-4 w-4" />
    </Button>

    <Button
      aria-label={`Edit transaction #${tx.id}`}
      size="icon"
      variant="ghost"
      className="h-8 w-8 p-0"
      onClick={() => onOpenForm(tx)}
    >
      <Pencil className="h-4 w-4" />
    </Button>

    <Button
      aria-label={`Remove transaction #${tx.id}`}
      size="icon"
      variant="ghost"
      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={() => onDelete(tx)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

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

  const disabled = false;

  const normalizedColumns = useMemo(() => columns, [columns]);

  const ctx = useMemo<CellRendererArgs>(
    () => ({
      tx: transaction,
      compact,
      disabled,
      inlineEdit,
      onOpenForm,
      onDelete,
      onToggleDraft,
      sheetOpen,
      onSheetOpenChange,
      titleId,
      descId,
      renderDetails,
    }),
    [
      transaction,
      compact,
      disabled,
      inlineEdit,
      onOpenForm,
      onDelete,
      onToggleDraft,
      sheetOpen,
      onSheetOpenChange,
      titleId,
      descId,
      renderDetails,
    ],
  );

  const cellsByKey: Record<TransactionRowColumn['key'], React.ReactNode> = useMemo(
    () => ({
      id: (
        <IdCell
          descId={ctx.descId}
          renderDetails={ctx.renderDetails}
          sheetOpen={ctx.sheetOpen}
          titleId={ctx.titleId}
          tx={ctx.tx}
          onSheetOpenChange={ctx.onSheetOpenChange}
          onToggleDraft={ctx.onToggleDraft}
        />
      ),
      account: <AccountCell compact={ctx.compact} disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />,
      amount: <AmountCell compact={ctx.compact} disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />,
      category: <CategoryCell compact={ctx.compact} disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />,
      note: <NoteCell compact={ctx.compact} disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />,
      executedAt: (
        <ExecutedAtCell compact={ctx.compact} disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />
      ),
      actions: (
        <ActionsCell
          tx={ctx.tx}
          onDelete={ctx.onDelete}
          onOpenForm={ctx.onOpenForm}
          onSheetOpenChange={ctx.onSheetOpenChange}
        />
      ),
    }),
    [ctx],
  );

  const onView = useMemo(() => () => ctx.onSheetOpenChange?.(true), [ctx]);
  const onEdit = useMemo(() => () => ctx.onOpenForm(ctx.tx), [ctx]);
  const onRemove = useMemo(() => () => ctx.onDelete(ctx.tx), [ctx]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow
          className={cn(
            'text-xs',
            ctx.tx.isDraft ? 'bg-warning/20 hover:bg-warning/30' : 'hover:bg-muted/50',
            className,
          )}
        >
          <TableCell className={cellClassName(ctx.compact, 'w-4')} />

          {normalizedColumns.map((c, idx) => (
            <TableCell className={cellClassName(ctx.compact, c.className)} key={`${c.key}-${idx}`}>
              {cellsByKey[c.key]}
            </TableCell>
          ))}
        </TableRow>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="flex items-center justify-between">
          <span className="truncate">Transaction #{ctx.tx.id}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{ctx.tx.executedAt.format('HH:mm')}</span>
        </ContextMenuLabel>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onView}>
          <Eye className="mr-2 h-4 w-4" />
          View details
        </ContextMenuItem>

        <ContextMenuItem onSelect={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={onRemove}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

ListingRow.displayName = 'TransactionListingRow';

export default ListingRow;
