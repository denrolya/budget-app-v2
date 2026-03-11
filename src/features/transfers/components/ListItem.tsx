import { ArrowRightLeft, Eye } from 'lucide-react';
import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { AccountPill } from '@/features/accounts';
import TransferDetails from '@/features/transfers/components/Details';
import FeeIndicator from '@/features/transfers/components/ListItemFeeIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import Transfer from '@/features/transfers/models/Transfer';

interface TransferItemProps {
  transfer: Transfer;
}

export const ListItem: React.FC<TransferItemProps> = ({ transfer }) => (
  <Card className="border-l-4 border-l-primary ease-in-out hover:shadow-md dark:hover:shadow-primary/25 transition-colors relative group overflow-visible">
    <CardContent className="p-2 flex flex-col space-y-1 hover:no-underline">
      <div className="flex flex-row items-center justify-between">
        <div className="flex-grow flex items-center space-x-2 overflow-x-auto">
          <MoneyValue
            amount={transfer.amount}
            currency={transfer.fromExpense.account.currency}
            useColors={false}
            className="text-xs font-medium"
          />
          <span className="text-muted-foreground hidden sm:flex items-center space-x-1">
            <AccountPill account={transfer.fromExpense.account} size="sm" className="flex-shrink-0" />
            <ArrowRightLeft className="h-3 w-3 flex-shrink-0" />
            <AccountPill account={transfer.toIncome.account} size="sm" className="flex-shrink-0" />
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
              <SheetTrigger asChild className="m-0">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                <SheetHeader>
                  <SheetTitle className="tracking-tight text-xl font-bold">Transfer Details</SheetTitle>
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

export default ListItem;
