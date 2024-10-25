import { ArrowRightLeft, Eye } from 'lucide-react';
import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountBadge from '@/components/features/accounts/Badge';
import TransferDetails from '@/components/features/transfers/Details';
import FeeIndicator from '@/components/features/transfers/ListItemFeeIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import Transfer from '@/models/Transfer';

interface TransferItemProps {
  transfer: Transfer;
}

export const ListItem: React.FC<TransferItemProps> = ({ transfer }) => (
  <Card className="mb-0.5 border-l-4 border-l-primary ease-in-out hover:shadow-md dark:hover:shadow-primary/25 transition-colors relative group overflow-visible">
    <CardContent className="p-2 flex flex-col space-y-1 hover:no-underline">
      <div className="flex flex-row items-center justify-between">
        <div className="flex-grow flex items-center space-x-2 overflow-x-auto">
          <MoneyValue
            useColors={false}
            className="text-xs font-medium"
            amount={transfer.amount}
            currency={transfer.fromExpense.account.currency}
          />
          <span className="text-muted-foreground hidden sm:flex items-center space-x-1">
            <AccountBadge account={transfer.fromExpense.account} size="sm" className="flex-shrink-0" />
            <ArrowRightLeft className="h-3 w-3 flex-shrink-0" />
            <AccountBadge account={transfer.toIncome.account} size="sm" className="flex-shrink-0" />
          </span>
          {transfer.feeExpense && transfer.hasFee() && (
            <FeeIndicator
              feeAmount={transfer.feeExpense.amount}
              feeCurrency={transfer.feeExpense.account.currency}
              transferAmount={transfer.amount}
            />
          )}
        </div>

        <div className="flex flex-row items-center space-x-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {transfer.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}
          </span>
          <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Sheet>
              <SheetTrigger className="m-0" asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                <SheetHeader>
                  <SheetTitle>Transfer Details</SheetTitle>
                </SheetHeader>
                <TransferDetails transfer={transfer} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ListItemSkeleton: React.FC = () => (
  <div className="relative mb-4 mt-4">
    <Card>
      <CardContent className="px-4 py-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 w-20 flex-shrink-0" />
            <div className="hidden sm:flex items-center space-x-2 overflow-hidden">
              <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
              <Skeleton className="h-3 w-3 flex-shrink-0" />
              <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
            </div>
            <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
          </div>
          <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
            <Skeleton className="h-4 w-24 hidden sm:inline-block" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ListItem;
