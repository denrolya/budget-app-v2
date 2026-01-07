import { ArrowRight, Eye, Trash2 } from 'lucide-react';
import React, { useId } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountPill from '@/features/accounts/components/Pill';
import RateDisplay from '@/features/transfers/components/RateDisplay';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TableCell, TableRow } from '@/components/ui/table';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';
import Transfer from '@/features/transfers/models/Transfer';

type TransferRowProps = {
  transfer: Transfer;
  compact?: boolean;

  renderDetails: (transfer: Transfer) => React.ReactNode;
  onDelete: (transfer: Transfer) => void;

  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  onViewDetailsClick?: () => void;

  className?: string;
};

export const ListingRow: React.FC<TransferRowProps> = ({
                                                         transfer,
                                                         compact = true,
                                                         renderDetails,
                                                         onDelete,
                                                         sheetOpen,
                                                         onSheetOpenChange,
                                                         onViewDetailsClick,
                                                         className,
                                                       }) => {
  const titleId = useId();
  const descId = useId();

  const fromRing = transfer.feeExpense?.account.id === transfer.fromExpense.account.id;
  const toRing = transfer.feeExpense?.account.id === transfer.toIncome.account.id;

  const cellClass = (extra?: string) => cn(compact ? 'py-0' : undefined, extra);

  return (
    <TableRow className={cn('text-xs hover:bg-muted/50', className)}>
      {/* Gutter column */}
      <TableCell className={cellClass('w-4')} />

      {/* ID column */}
      <TableCell className={cellClass('pl-4')}>
        <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="text-left"
              aria-label={`Open transfer #${transfer.id} details`}
              aria-haspopup="dialog"
              aria-expanded={!!sheetOpen}
            >
              <code className="cursor-context-menu tracking-tighter text-xs antialiased select-all text-muted-foreground">
                #{transfer.id}
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
                  Transfer Details
                </SheetTitle>
                <SheetDescription id={descId} className="flex justify-between items-center">
                  <span>
                    ID: <code className="text-muted-foreground">#{transfer.id}</code>
                  </span>
                </SheetDescription>
              </SheetHeader>
              <div className="flex-grow overflow-y-auto p-6">{renderDetails(transfer)}</div>
            </div>
          </SheetContent>
        </Sheet>
      </TableCell>

      {/* Accounts / “Type” column */}
      <TableCell className={cellClass()}>
        <div className="flex items-center gap-2 min-w-0">
          <AccountPill
            size="sm"
            variant={fromRing ? 'pill' : 'inline'}
            className={cn('min-w-0', { 'ring-2 ring-destructive': fromRing })}
            account={transfer.fromExpense.account}
          />
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <AccountPill
            size="sm"
            variant={toRing ? 'pill' : 'inline'}
            className={cn('min-w-0', { 'ring-2 ring-destructive': toRing })}
            account={transfer.toIncome.account}
          />
        </div>
      </TableCell>

      {/* Amount column (primary numeric accent, match transaction weight/feel) */}
      <TableCell className={cellClass()}>
        <div className="space-y-1">
          <div className="flex flex-row items-center">
            <MoneyValue
              className="font-semibold tracking-tight tabular-nums"
              amount={-transfer.fromExpense.amount}
              currency={transfer.fromExpense.account.currency}
            />
            <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
            <MoneyValue
              className="font-semibold tracking-tight tabular-nums"
              amount={transfer.toIncome.amount}
              currency={transfer.toIncome.account.currency}
            />
          </div>

          {transfer.feeExpense && (
            <small className="flex items-center text-muted-foreground">
              <span className="mr-1">Fee:</span>
              <MoneyValue
                className="font-mono text-xs tabular-nums"
                useColors={false}
                amount={-transfer.feeExpense.amount}
                currency={transfer.feeExpense.account.currency}
              />
            </small>
          )}
        </div>
      </TableCell>

      {/* Rate column (make secondary, consistent hierarchy) */}
      <TableCell className={cellClass()}>
        <div className="space-y-1">
          <RateDisplay transfer={transfer} />
        </div>
      </TableCell>

      {/* Note column */}
      <TableCell className={cellClass('max-w-[14rem] sm:max-w-xs truncate text-muted-foreground')}>
        {transfer.note}
      </TableCell>

      {/* Time column */}
      <TableCell className={cellClass('whitespace-nowrap tabular-nums')}>
        {transfer.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}
      </TableCell>

      {/* Actions column */}
      <TableCell className={cellClass('text-right')}>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`View transfer #${transfer.id} details`}
            className="h-8 w-8 p-0"
            onClick={onViewDetailsClick ?? (() => onSheetOpenChange?.(true))}
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove transfer #${transfer.id}`}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(transfer)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

ListingRow.displayName = 'TransferListingRow';

export default ListingRow;
