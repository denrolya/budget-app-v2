import { ArrowRight, Eye, Trash2 } from 'lucide-react';
import { Moment } from 'moment';
import React, { useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import AccountBadge from '@/components/features/accounts/Badge';
import Details from '@/components/features/transfers/Details';
import RateDisplay from '@/components/features/transfers/RateDisplay';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT, MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import Transfer from '@/models/Transfer';

interface Props {
  groupedItems: [Moment, Transfer[], number, number][];
  compact?: boolean;
}

export const TableListing: React.FC<Props> = ({ groupedItems, compact = true }) => {
  const [openSheetId, setOpenSheetId] = useState<number | null>(null);
  const toggleSheet = (transferId: number) => {
    setOpenSheetId((prevId) => (prevId === transferId ? null : transferId));
  };

  const handleDelete = (transfer: Transfer) => {
    // Implement delete functionality here
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
                <TableRow key={transfer.id}>
                  <TableCell
                    colSpan={2}
                    className={cn('ml-4 w-[1%]', {
                      'py-0': compact,
                    })}
                  >
                    <Sheet
                      open={openSheetId === transfer.id}
                      onOpenChange={(open) => setOpenSheetId(open ? transfer.id : null)}
                    >
                      <SheetTrigger asChild>
                        <code className="cursor-context-menu tracking-tighter text-xs antialiased select-all text-muted-foreground">
                          #{transfer.id}
                        </code>
                      </SheetTrigger>
                      <SheetContent side="right" className="p-0 overflow-y-auto">
                        <div className="h-full flex flex-col">
                          <SheetHeader className="p-6 pb-0">
                            <SheetTitle className="tracking-tight text-xl font-bold">Transfer Details</SheetTitle>
                            <SheetDescription className="flex justify-between items-center">
                              <span>
                                ID: <code className="text-muted-foreground">#{transfer.id}</code>
                              </span>
                            </SheetDescription>
                          </SheetHeader>
                          <div className="flex-grow overflow-y-auto p-6">
                            <Details transfer={transfer} />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                  <TableCell
                    className={cn({
                      'py-0': compact,
                    })}
                  >
                    <div className="flex items-center space-x-2">
                      <AccountBadge
                        size="sm"
                        account={transfer.fromExpense.account}
                        className={
                          transfer.feeExpense?.account.id === transfer.fromExpense.account.id
                            ? 'ring-2 ring-destructive'
                            : ''
                        }
                      />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <AccountBadge
                        size="sm"
                        account={transfer.toIncome.account}
                        className={
                          transfer.feeExpense?.account.id === transfer.toIncome.account.id
                            ? 'ring-2 ring-destructive'
                            : ''
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn({
                      'py-0': compact,
                    })}
                  >
                    <>
                      <div className="flex flex-row items-center">
                        <MoneyValue
                          className="font-mono text-xs antialiased"
                          amount={-transfer.fromExpense.amount}
                          currency={transfer.fromExpense.account.currency}
                        />
                        <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                        <MoneyValue
                          className="font-mono text-xs antialiased"
                          amount={transfer.toIncome.amount}
                          currency={transfer.toIncome.account.currency}
                        />
                      </div>
                      <div className="text-muted-foreground">
                        {transfer.feeExpense && (
                          <small className="flex items-center">
                            <span className="mr-1">Fee:</span>
                            <MoneyValue
                              className="font-mono"
                              useColors={false}
                              amount={-transfer.feeExpense.amount}
                              currency={transfer.feeExpense.account.currency}
                            />
                          </small>
                        )}
                      </div>
                    </>
                  </TableCell>
                  <TableCell
                    className={cn('text-xs', {
                      'py-0': compact,
                    })}
                  >
                    <RateDisplay transfer={transfer} />
                    <div className="text-xs text-muted-foreground">
                      <span>Rate: {Number(transfer.rate.toFixed(4))}</span>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn('max-w-xs', 'truncate', {
                      'py-0': compact,
                    })}
                  >
                    {transfer.note}
                  </TableCell>
                  <TableCell
                    className={cn({
                      'py-0': compact,
                    })}
                  >
                    {transfer.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}
                  </TableCell>
                  <TableCell
                    className={cn('text-right', {
                      'py-0': compact,
                    })}
                  >
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="View Transfer Details"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleSheet(transfer.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove Transfer"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(transfer)}
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
    </div>
  );
};

TableListing.displayName = 'TransfersTableListing';

export default TableListing;
