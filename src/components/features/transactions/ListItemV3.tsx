import React from 'react';
import { Eye, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import Transaction, { Type } from '@/models/Transaction';
import TransactionValue from '@/components/common/TransactionValue';
import AccountBadge from '@/components/features/accounts/Badge';
import Details from '@/components/features/transactions/Details';

interface TransactionItemProps {
  transaction: Transaction;
  colorBorder?: boolean;
}

export const ListItem: React.FC<TransactionItemProps> = ({ transaction, colorBorder = false }) => {
  const { openForm } = useFormContext();

  return (
    <Card
      className={`mb-0.5 hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors ${
        colorBorder && transaction.type === Type.Income ? 'border-l-2 border-l-green-500' :
          colorBorder && transaction.type === Type.Expense ? 'border-l-2 border-l-red-500' : ''
      }`}
    >
      <CardContent className="p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between sm:space-x-2">
        <div className="flex items-center justify-between sm:justify-end sm:flex-grow-0 sm:flex-shrink-0 space-x-2 mb-1 sm:mb-0 order-1 sm:order-2">
          <AccountBadge account={transaction.account} size="sm" />
          <Badge variant="outline" className="text-xs px-1 py-0 whitespace-nowrap">
            {transaction.category.name}
          </Badge>
          <TransactionValue transaction={transaction} className="text-xs whitespace-nowrap" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {transaction.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}
          </span>
          <div className="flex items-center space-x-1">
            {transaction?.debt?.debtor && (
              <Badge variant="outline" className="text-[10px] flex items-center px-1">
                <User className="h-3 w-3 mr-1" />
                {transaction.debt.debtor}
              </Badge>
            )}
            {transaction.isDraft && (
              <Badge variant="outline" className="bg-primary text-primary-foreground text-[10px] px-1">Draft</Badge>
            )}
            {transaction.compensations && transaction.compensations.length > 0 && (
              <Badge variant="outline" className="bg-secondary text-secondary-foreground text-[10px] px-1">
                Compensated
              </Badge>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Transaction Details</DialogTitle>
                </DialogHeader>
                <Details transaction={transaction} onEdit={() => openForm(FormType.Transaction, transaction)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="w-full sm:w-auto sm:flex-grow sm:mr-2 order-2 sm:order-1">
          <ResponsiveTooltip
            openDelay={0}
            content={<p>{transaction.note || 'No note'}</p>}
            triggerClassName="w-full overflow-hidden"
          >
            <span className="text-sm text-muted-foreground truncate block">
              {transaction.note}
            </span>
          </ResponsiveTooltip>
        </div>
      </CardContent>
    </Card>
  );
};

export const ListItemSkeleton: React.FC = () => (
  <Card className="mb-0.5">
    <CardContent className="p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between sm:space-x-2">
      <div className="flex items-center justify-between sm:justify-end sm:flex-grow-0 sm:flex-shrink-0 space-x-2 mb-1 sm:mb-0 order-1 sm:order-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="w-full sm:w-auto sm:flex-grow sm:mr-2 order-2 sm:order-1">
        <Skeleton className="h-5 w-full" />
      </div>
    </CardContent>
  </Card>
);

export default ListItem;
