import type { Moment } from 'moment';
import React, { useState } from 'react';

import DateGroupHeaderRow from '@/components/common/DateGroupHeaderRow';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import Details from '@/features/transfers/components/Details';
import TransferRow from '@/features/transfers/components/ListingRow';
import Transfer from '@/features/transfers/models/Transfer';
import { confirm } from '@/lib/confirmation';

import { useMutations as useTransfersMutations } from '../api/mutations';

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

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[760px]">
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead />
            <TableHead>ID</TableHead>
            <TableHead>Transfer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {groupedItems.map(([date, transfers, totalValue, totalItems]) => {
            const dateKey = date.format(BACKEND_DATE_FORMAT);

            return (
              <React.Fragment key={dateKey}>
                <DateGroupHeaderRow
                  compact={compact}
                  left={
                    <RelativeDatetimeDisplay
                      showDayBadge
                      badgeSize="sm"
                      date={date}
                      showTime={false}
                      variant="default"
                    />
                  }
                  right={
                    <SummaryBadge
                      count={totalItems}
                      icon={ROUTES.TRANSFER_LIST.icon}
                      useColors={false}
                      value={totalValue}
                    />
                  }
                  cellClassName="bg-muted/40"
                />

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
