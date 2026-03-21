import { ArrowRight, Eye, Pencil, Trash2 } from 'lucide-react';
import React, { useId, useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TableCell, TableRow } from '@/components/ui/table';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { AccountPill } from '@/features/accounts';
import RateDisplay from '@/features/transfers/components/RateDisplay';
import type Transfer from '@/features/transfers/models/Transfer';
import { cn } from '@/lib/utils';

type Props = {
  transfer: Transfer;
  compact?: boolean;

  renderDetails: (transfer: Transfer) => React.ReactNode;
  onDelete: (transfer: Transfer) => void;
  onEdit?: (transfer: Transfer) => void;

  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;

  className?: string;
};

const cellClassName = (compact: boolean, extra?: string) =>
  cn('min-w-0 align-middle', compact ? 'py-0' : undefined, extra);

const IdCell: React.FC<{
  transfer: Transfer;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  titleId: string;
  descId: string;
  renderDetails: (t: Transfer) => React.ReactNode;
}> = ({ transfer, sheetOpen, onSheetOpenChange, titleId, descId, renderDetails }) => (
  <div className="flex items-center min-w-0">
    <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
      <SheetTrigger asChild>
        <button
          aria-expanded={sheetOpen}
          aria-haspopup="dialog"
          aria-label={`Open transfer #${transfer.id} details`}
          type="button"
          className="min-w-0 w-[74px] text-left"
        >
          <code className="block min-w-0 truncate cursor-context-menu tracking-tighter antialiased select-all text-muted-foreground">
            #{transfer.id}
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
          Transfer Details
        </SheetTitle>
        <SheetDescription id={descId} className="sr-only">
          #{transfer.id}
        </SheetDescription>

        {/* Compact header strip */}
        <div className="h-10 shrink-0 flex items-center gap-2.5 px-4 border-b">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-muted/60 text-muted-foreground border-border">
            Transfer
          </span>
          <code className="text-xs text-muted-foreground font-mono">#{transfer.id}</code>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 py-3">{renderDetails(transfer)}</div>
      </SheetContent>
    </Sheet>
  </div>
);

const FeeDot = () => (
  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-warning rounded-full" />
);

const AccountsCell: React.FC<{ transfer: Transfer }> = ({ transfer }) => {
  const feeAccountIds = new Set(transfer.feeExpenses.map((tx) => tx.account.id));
  const fromHasFee = feeAccountIds.has(transfer.fromExpense.account.id);
  const toHasFee = feeAccountIds.has(transfer.toIncome.account.id);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative min-w-0 [&_*]:min-w-0">
        <AccountPill account={transfer.fromExpense.account} size="sm" variant="inline" className="min-w-0" />
        {fromHasFee && <FeeDot />}
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

      <div className="relative min-w-0 [&_*]:min-w-0">
        <AccountPill account={transfer.toIncome.account} size="sm" variant="inline" className="min-w-0" />
        {toHasFee && <FeeDot />}
      </div>
    </div>
  );
};

const AmountCell: React.FC<{ transfer: Transfer }> = ({ transfer }) => (
  <div className="min-w-0 space-y-1">
    <div className="min-w-0 flex items-center whitespace-nowrap">
      <div className="min-w-0 overflow-hidden">
        <MoneyValue
          amount={-transfer.fromExpense.amount}
          currency={transfer.fromExpense.account.currency}
          className="font-semibold tracking-tight tabular-nums"
        />
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 shrink-0" />

      <div className="min-w-0 overflow-hidden">
        <MoneyValue
          amount={transfer.toIncome.amount}
          currency={transfer.toIncome.account.currency}
          className="font-semibold tracking-tight tabular-nums"
        />
      </div>
    </div>

    {transfer.hasFee() ? (
      <div className="min-w-0 overflow-hidden whitespace-nowrap text-muted-foreground text-[11px] leading-4">
        <span className="mr-1">{transfer.feeExpenses.length > 1 ? 'Fees:' : 'Fee:'}</span>
        <MoneyValue
          amount={-transfer.totalFees()}
          currency={transfer.fromExpense.account.currency}
          useColors={false}
          className="font-mono tabular-nums"
        />
      </div>
    ) : null}
  </div>
);

const NoteCell: React.FC<{ note: string }> = ({ note }) => (
  <span className="block min-w-0 truncate text-muted-foreground">{note}</span>
);

const ActionsCell: React.FC<{
  transfer: Transfer;
  onView: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}> = ({ transfer, onView, onDelete, onEdit }) => (
  <div className="flex justify-end gap-2 shrink-0">
    <Button
      aria-label={`View transfer #${transfer.id} details`}
      size="icon"
      variant="ghost"
      className="h-8 w-8 p-0"
      onClick={onView}
    >
      <Eye className="h-4 w-4" />
    </Button>

    {onEdit && (
      <Button
        aria-label={`Edit transfer #${transfer.id}`}
        size="icon"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    )}

    <Button
      aria-label={`Remove transfer #${transfer.id}`}
      size="icon"
      variant="ghost"
      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={onDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

export const ListingRow: React.FC<Props> = ({
  transfer,
  compact = true,
  renderDetails,
  onDelete,
  onEdit,
  sheetOpen,
  onSheetOpenChange,
  className,
}) => {
  const titleId = useId();
  const descId = useId();

  const onView = useMemo(() => () => onSheetOpenChange?.(true), [onSheetOpenChange]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow className={cn('text-xs hover:bg-muted/50', className)}>
          <TableCell className={cellClassName(compact, 'w-4')} />

          <TableCell className={cellClassName(compact, 'pl-4')}>
            <IdCell
              descId={descId}
              renderDetails={renderDetails}
              sheetOpen={sheetOpen}
              titleId={titleId}
              transfer={transfer}
              onSheetOpenChange={onSheetOpenChange}
            />
          </TableCell>

          <TableCell className={cellClassName(compact)}>
            <AccountsCell transfer={transfer} />
          </TableCell>

          <TableCell className={cellClassName(compact)}>
            <AmountCell transfer={transfer} />
          </TableCell>

          <TableCell className={cellClassName(compact)}>
            <div className="min-w-0 overflow-hidden">
              <RateDisplay transfer={transfer} />
            </div>
          </TableCell>

          <TableCell className={cellClassName(compact, 'whitespace-nowrap tabular-nums')}>
            {transfer.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}
          </TableCell>

          <TableCell className={cellClassName(compact)}>
            <NoteCell note={transfer.note} />
          </TableCell>

          <TableCell className={cellClassName(compact, 'text-right')}>
            <ActionsCell
              transfer={transfer}
              onDelete={() => onDelete(transfer)}
              onEdit={onEdit ? () => onEdit(transfer) : undefined}
              onView={onView}
            />
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="flex items-center justify-between">
          <span className="truncate">Transfer #{transfer.id}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{transfer.executedAt.format('HH:mm')}</span>
        </ContextMenuLabel>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onView}>
          <Eye className="mr-2 h-4 w-4" />
          View details
        </ContextMenuItem>

        {onEdit && (
          <ContextMenuItem onSelect={() => onEdit(transfer)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(transfer)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

ListingRow.displayName = 'TransferListingRow';

export default ListingRow;
