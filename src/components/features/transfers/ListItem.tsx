import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime.ts';
import { ArrowRightLeft, Eye } from 'lucide-react';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';
import MoneyValue from '@/components/common/MoneyValue';
import AccountBadge from '@/components/features/accounts/Badge';
import TransferDetails from '@/components/features/transfers/Details';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip.tsx';
import Transfer from '@/models/Transfer';

interface TransferItemProps {
  transfer: Transfer;
}

export const ListItem: React.FC<TransferItemProps> = ({ transfer }) => (
  <Card className="my-2 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
    <CardContent className="px-4 py-2 hover:no-underline hover:bg-accent/50">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-2 text-sm">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          <MoneyValue className="font-medium font-mono"
                      amount={transfer.amount}
                      currency={transfer.fromExpense.account.currency} />
          <span className="text-muted-foreground hidden sm:inline">
            <AccountBadge account={transfer.fromExpense.account} size="sm" />
            {' → '}
            <AccountBadge account={transfer.toIncome.account} size="sm" />
          </span>
          {transfer.hasFee() && (
            <ResponsiveTooltip content={<p>Fees applied to this transfer</p>} openDelay={0}>
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            </ResponsiveTooltip>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">{transfer.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Transfer Details</DialogTitle>
              </DialogHeader>
              <TransferDetails transfer={transfer} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ListItemSkeleton: React.FC = () => (
  <Card className="border-l-4 border-l-primary shadow-md">
    <CardContent className="px-4 py-2">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <div className="hidden sm:flex items-center space-x-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-24 hidden sm:inline-block" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ListItem;
