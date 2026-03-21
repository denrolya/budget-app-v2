import { Eye, FileCheck, Pencil, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useId, useMemo } from 'react';

import CellPopover from '@/components/common/CellPopover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TableCell, TableRow } from '@/components/ui/table';
import { MOMENT_DATETIME_FORM_FORMAT, MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { AccountPill, AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import { cn } from '@/lib/utils';

import { type useInlineEdit } from '../hooks/useInlineEdit';
import type Transaction from '../models/Transaction';
import { Type as TransactionType } from '../types';

import CompensationPip from './CompensationPip';
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

const cellClassName = (compact: boolean, extra?: string) =>
  cn('min-w-0 align-middle', compact ? 'py-0' : undefined, extra);

// ─── Cell renderers ───────────────────────────────────────────────────────────

const IdCell = ({
  tx,
  onToggleDraft: _onToggleDraft,
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
        className="p-0 w-full sm:max-w-[380px] flex flex-col"
      >
        {/* A11y labels */}
        <SheetTitle id={titleId} className="sr-only">
          Transaction Details
        </SheetTitle>
        <SheetDescription id={descId} className="sr-only">
          #{tx.id}
        </SheetDescription>

        {/* Compact header strip */}
        <div className="h-10 shrink-0 flex items-center gap-2.5 px-4 border-b">
          <span
            className={cn(
              'text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border',
              tx.type === TransactionType.Income
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-destructive/10 text-destructive border-destructive/20',
            )}
          >
            {tx.type}
          </span>
          <code className="text-xs text-muted-foreground font-mono">#{tx.id}</code>
          {tx.isDraft && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-warning/10 text-warning-foreground border-warning/20">
              draft
            </span>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 py-3">{renderDetails(tx)}</div>
      </SheetContent>
    </Sheet>
  </div>
);

const AccountCell = ({ tx, disabled, inlineEdit }: Pick<CellRendererArgs, 'tx' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, save, cancelEdit, startEdit } = inlineEdit;
  const rawId = (editValue as { id?: number } | null)?.id ?? (editValue as number | null);
  const accountEditValue = rawId != null ? String(rawId) : null;

  return (
    <CellPopover
      disabled={disabled}
      saveOnEnter={false}
      trigger={
        <div className="min-w-0 [&_*]:min-w-0">
          <AccountPill account={tx.account} size="sm" variant="inline" className="min-w-0" />
        </div>
      }
      contentClassName="w-56"
      onCancel={cancelEdit}
      onOpen={() => startEdit(tx, 'account')}
      onSave={() => void save(tx)}
    >
      <AccountTypeahead
        autoFocus
        multiple={false}
        value={accountEditValue}
        onChange={(v) => setEditValue(v as string | number | null)}
      />
    </CellPopover>
  );
};

const AmountCell = ({ tx, disabled, inlineEdit }: Pick<CellRendererArgs, 'tx' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, save, cancelEdit, startEdit } = inlineEdit;
  const isCompensated = tx.isExpense() && (tx.compensations?.length ?? 0) > 0;
  const valueClassName = cn('font-semibold tracking-tight', { 'text-warning': isCompensated });

  return (
    <div className="relative">
      <CellPopover
        disabled={disabled}
        trigger={<TransactionValue revert transaction={tx} className={valueClassName} />}
        contentClassName="w-40"
        onCancel={cancelEdit}
        onOpen={() => startEdit(tx, 'amount')}
        onSave={() => void save(tx)}
      >
        <Input autoFocus type="number" value={String(editValue ?? '')} onChange={(e) => setEditValue(e.target.value)} />
      </CellPopover>
      {isCompensated && <CompensationPip transaction={tx} />}
    </div>
  );
};

const CategoryCell = ({ tx, disabled, inlineEdit }: Pick<CellRendererArgs, 'tx' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, save, cancelEdit, startEdit } = inlineEdit;

  return (
    <CellPopover
      disabled={disabled}
      saveOnEnter={false}
      triggerTitle={tx.category.name}
      trigger={
        <Badge variant="outline" className="text-2xs font-mono font-normal max-w-full overflow-hidden cursor-pointer">
          <span className="truncate min-w-0">{tx.category.name}</span>
        </Badge>
      }
      contentClassName="w-56"
      onCancel={cancelEdit}
      onOpen={() => startEdit(tx, 'category')}
      onSave={() => void save(tx)}
    >
      <CategoryTypeahead
        autoFocus
        multiple={false}
        type={tx.type}
        value={
          ((editValue as { id?: number } | null)?.id ?? editValue) != null
            ? String((editValue as { id?: number } | null)?.id ?? editValue)
            : null
        }
        onChange={(v) => setEditValue(v as string | number | null)}
      />
    </CellPopover>
  );
};

const NoteCell = ({ tx, disabled, inlineEdit }: Pick<CellRendererArgs, 'tx' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, save, cancelEdit, startEdit } = inlineEdit;

  return (
    <CellPopover
      disabled={disabled}
      trigger={<span className="block min-w-0 truncate text-muted-foreground">{tx.note}</span>}
      contentClassName="w-64"
      onCancel={cancelEdit}
      onOpen={() => startEdit(tx, 'note')}
      onSave={() => void save(tx)}
    >
      <Input
        autoFocus
        placeholder="Note…"
        value={String(editValue ?? '')}
        onChange={(e) => setEditValue(e.target.value)}
      />
    </CellPopover>
  );
};

const ExecutedAtCell = ({ tx, disabled, inlineEdit }: Pick<CellRendererArgs, 'tx' | 'disabled' | 'inlineEdit'>) => {
  const { editValue, setEditValue, save, cancelEdit, startEdit } = inlineEdit;

  return (
    <CellPopover
      disabled={disabled}
      trigger={<span className="tabular-nums whitespace-nowrap">{tx.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}</span>}
      onCancel={cancelEdit}
      onOpen={() => startEdit(tx, 'executedAt')}
      onSave={() => void save(tx)}
    >
      <Input
        autoFocus
        type="datetime-local"
        value={moment(editValue as string | number | null).format(MOMENT_DATETIME_FORM_FORMAT)}
        onChange={(e) => setEditValue(e.target.value)}
      />
    </CellPopover>
  );
};

const ActionsCell = ({
  tx,
  onOpenForm,
  onDelete,
  onToggleDraft,
  onSheetOpenChange,
}: Pick<CellRendererArgs, 'tx' | 'onOpenForm' | 'onDelete' | 'onToggleDraft' | 'onSheetOpenChange'>) => (
  <div className="flex justify-end gap-2 shrink-0">
    {tx.isDraft && onToggleDraft && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={`Unmark transaction #${tx.id} as draft`}
            size="icon"
            variant="ghost"
            className="h-8 w-8 p-0 text-warning hover:text-warning hover:bg-warning/10"
            onClick={() => onToggleDraft(tx)}
          >
            <FileCheck className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Unmark as draft</TooltipContent>
      </Tooltip>
    )}

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

// ─── Row ──────────────────────────────────────────────────────────────────────

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
  const isCompensated = transaction.isExpense() && (transaction.compensations?.length ?? 0) > 0;

  const ctx = useMemo<CellRendererArgs>(
    () => ({
      tx: transaction,
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
      account: <AccountCell disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />,
      amount: <AmountCell disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />,
      category: <CategoryCell disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />,
      note: <NoteCell disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />,
      executedAt: <ExecutedAtCell disabled={ctx.disabled} inlineEdit={ctx.inlineEdit} tx={ctx.tx} />,
      actions: (
        <ActionsCell
          tx={ctx.tx}
          onDelete={ctx.onDelete}
          onOpenForm={ctx.onOpenForm}
          onSheetOpenChange={ctx.onSheetOpenChange}
          onToggleDraft={ctx.onToggleDraft}
        />
      ),
    }),
    [ctx],
  );

  const onView = useCallback(() => ctx.onSheetOpenChange?.(true), [ctx]);
  const onEdit = useCallback(() => ctx.onOpenForm(ctx.tx), [ctx]);
  const onRemove = useCallback(() => ctx.onDelete(ctx.tx), [ctx]);
  const onUnmarkDraft = useCallback(() => ctx.onToggleDraft?.(ctx.tx), [ctx]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow
          className={cn(
            'text-xs',
            {
              'bg-warning/20 hover:bg-warning/30': ctx.tx.isDraft,
              'bg-warning/5 hover:bg-warning/10': isCompensated && !ctx.tx.isDraft,
              'hover:bg-muted/50': !ctx.tx.isDraft && !isCompensated,
            },
            className,
          )}
        >
          <TableCell className={cellClassName(compact, 'w-4')} />

          {columns.map((c, idx) => (
            <TableCell className={cellClassName(compact, c.className)} key={`${c.key}-${idx}`}>
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

        {ctx.tx.isDraft && ctx.onToggleDraft && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={onUnmarkDraft}>
              <FileCheck className="mr-2 h-4 w-4 text-warning" />
              Unmark as draft
            </ContextMenuItem>
          </>
        )}

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
