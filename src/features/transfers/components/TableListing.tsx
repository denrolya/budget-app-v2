import type { Moment } from 'moment';
import React, { useMemo, useState } from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import Details from '@/features/transfers/components/Details';
import TransferRow from '@/features/transfers/components/ListingRow';
import Transfer from '@/features/transfers/models/Transfer';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';

import { useMutations as useTransfersMutations } from '../api/mutations';

const COLS = {
  gutter: 'w-3 shrink-0',
  id: 'w-[74px] shrink-0',
  accounts: 'w-[260px]',
  amount: 'w-[200px] shrink-0',
  rate: 'w-[150px] shrink-0',
  note: 'w-auto',
  executedAt: 'w-[72px] shrink-0',
  actions: 'w-[96px] shrink-0',
} as const;

interface Props {
  groupedItems: [Moment, Transfer[], number, number][];
  compact?: boolean;
}

export const TableListing: React.FC<Props> = ({ groupedItems, compact = true }) => {
  const { delete: deleteTransfer } = useTransfersMutations();
  const [openSheetId, setOpenSheetId] = useState<number | null>(null);

  const handleDelete = async (transfer: Transfer) => {
    const isConfirmed = await confirm({
      title: 'Are you absolutely sure?',
      description: `You are about to delete transfer #${transfer.id}. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!isConfirmed) return;

    await deleteTransfer(Number(transfer.id));
  };

  const totalColumnsCount = useMemo(() => 8, []);

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <Table className="w-full min-w-0 table-fixed">
        <colgroup>
          <col className={COLS.gutter} />
          <col className={COLS.id} />
          <col className={COLS.accounts} />
          <col className={COLS.amount} />
          <col className={COLS.rate} />
          <col className={COLS.note} />
          <col className={COLS.executedAt} />
          <col className={COLS.actions} />
        </colgroup>

        <TableHeader className="sr-only">
          <TableRow>
            <TableHead>Gutter</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Transfer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {groupedItems.map(([date, transfers, totalValue, totalItems]) => {
            const dateKey = date.format(BACKEND_DATE_FORMAT);

            return (
              <React.Fragment key={dateKey}>
                <TableRow>
                  <TableCell colSpan={totalColumnsCount} className={cn('bg-muted/40 px-4', compact && 'py-0')}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <RelativeDatetimeDisplay
                        showDayBadge
                        badgeSize="sm"
                        date={date}
                        showTime={false}
                        variant="default"
                      />
                      <SummaryBadge
                        count={totalItems}
                        icon={ROUTES.TRANSFER_LIST.icon}
                        useColors={false}
                        value={totalValue}
                      />
                    </div>
                  </TableCell>
                </TableRow>

                {transfers.map((transfer) => (
                  <TransferRow
                    compact={compact}
                    renderDetails={(t) => <Details transfer={t} />}
                    sheetOpen={openSheetId === transfer.id}
                    transfer={transfer}
                    key={transfer.id}
                    onDelete={handleDelete}
                    onSheetOpenChange={(open) => setOpenSheetId(open ? transfer.id : null)}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

TableListing.displayName = 'TransfersTableListing';

export default TableListing;
