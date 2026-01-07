import { Moment } from 'moment';
import React, { useState } from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import Details from '@/features/transfers/components/Details';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import Transfer from '@/features/transfers/models/Transfer';
import TransferRow from '@/features/transfers/components/ListingRow';

interface Props {
  groupedItems: [Moment, Transfer[], number, number][];
  compact?: boolean;
}

export const TableListing: React.FC<Props> = ({ groupedItems, compact = true }) => {
  const [openSheetId, setOpenSheetId] = useState<number | null>(null);

  const handleDelete = (transfer: Transfer) => {
    // Implement delete functionality here
    // (keep this table-specific; combined listing will call its own handler)
    console.log('Delete transfer:', transfer.id);
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead className="w-4"></TableHead>
            <TableHead className="w-1/12">ID</TableHead>
            <TableHead className="w-3/12">Transfer</TableHead>
            <TableHead className="w-2/12">Amount</TableHead>
            <TableHead className="w-2/12">Rate</TableHead>
            <TableHead className="w-2/12">Note</TableHead>
            <TableHead className="w-1/12">Time</TableHead>
            <TableHead className="w-1/12 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {groupedItems.map(([date, transfers, totalValue, totalItems]) => (
            <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
              <TableRow>
                <TableCell
                  colSpan={8}
                  className={cn('bg-muted/40', 'px-4', {
                    'py-0': compact,
                  })}
                >
                  <div className="flex flex-wrap justify-between items-center">
                    <RelativeDatetimeDisplay
                      showDayBadge
                      badgeSize="sm"
                      variant="default"
                      showTime={false}
                      date={date}
                    />
                    <SummaryBadge
                      useColors={false}
                      icon={ROUTES.TRANSFER_LIST.icon}
                      count={totalItems}
                      value={totalValue}
                    />
                  </div>
                </TableCell>
              </TableRow>

              {transfers.map((transfer) => (
                <TransferRow
                  key={transfer.id}
                  transfer={transfer}
                  compact={compact}
                  renderDetails={(t) => <Details transfer={t} />}
                  onDelete={handleDelete}
                  sheetOpen={openSheetId === transfer.id}
                  onSheetOpenChange={(open) => setOpenSheetId(open ? transfer.id : null)}
                  onViewDetailsClick={() =>
                    setOpenSheetId((prev) => (prev === transfer.id ? null : transfer.id))
                  }
                />
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

TableListing.displayName = 'TransfersTableListing';

export default TableListing;
