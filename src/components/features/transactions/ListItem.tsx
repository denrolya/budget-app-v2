import cn from 'classnames';
import { Eye, InfoIcon, MoreHorizontal, User } from 'lucide-react';
import React from 'react';

import AccountAvatar from '@/components/features/accounts/Avatar.tsx';
import AccountBadge from '@/components/features/accounts/Badge';
import { TransactionValue } from '@/components/common/TransactionValue';
import { Details } from '@/components/features/transactions/Details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { Transaction, Type } from '@/models/transaction';

interface TransactionListItemProps {
  transaction: Transaction;
  isCompensationView?: boolean;
  colorBorder?: boolean;
}

export const ListItem: React.FC<TransactionListItemProps> = ({
                                                               transaction,
                                                               isCompensationView = false,
                                                               colorBorder = false,
                                                             }) => {
  const { openForm } = useFormContext();
  const isCompensated = transaction.type === Type.Expense && transaction.compensations && transaction.compensations?.length > 0;
  const isCompensation = transaction.category.name === 'Compensation';
  const isDebt = transaction.debt && transaction.debt.debtor;

  const onEdit = () => openForm(FormType.Transaction, transaction);

  return (
    <Card className={cn('shadow-md hover:shadow-lg transition-shadow', {
      'border-l-4 border-l-green-500': colorBorder && transaction.type === Type.Income,
      'border-l-4 border-l-red-500': colorBorder && transaction.type === Type.Expense,
    })}>
      <CardContent className="p-2">
        <div className="flex items-center space-x-4">
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 text-sm">
                <ResponsiveTooltip
                  openDelay={0}
                  contentClassName="w-80"
                  content={
                    <div className="flex justify-between space-x-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">@nextjs</h4>
                        <p className="text-sm">
                          The React Framework – created and maintained by @vercel.
                        </p>
                        <div className="flex items-center pt-2">
                          <InfoIcon className="mr-2 h-4 w-4 opacity-70" />{' '}
                          <span className="text-xs text-muted-foreground">
                            Joined December 2021
                          </span>
                        </div>
                      </div>
                    </div>}>
                  <Badge className="text-xs font-mono" variant={(transaction.type === Type.Income) ? 'success' : 'destructive'}>
                    <TransactionValue transaction={transaction} />
                  </Badge>
                </ResponsiveTooltip>
                <ResponsiveTooltip openDelay={0} content={<p>{transaction.category.name}</p>}>
                  <span className="font-medium truncate max-w-[150px] sm:max-w-none cursor-help">
                        {transaction.category.name}
                      </span>
                </ResponsiveTooltip>
                {(isCompensated || isCompensation) && (
                  <Badge variant="outline" className="text-xs">
                    {isCompensated ? 'Compensated' : 'Compensation'}
                  </Badge>
                )}
                {isDebt && (
                  <Badge variant="outline" className="text-xs flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {transaction.debt.debtor}
                  </Badge>
                )}
                {transaction.note && (
                  <ResponsiveTooltip openDelay={0} content={<p>{transaction.note}</p>}>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </ResponsiveTooltip>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!isCompensationView && (
                  <>
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
                        <Details transaction={transaction} onEdit={onEdit} />
                      </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                          Edit transaction
                        </DropdownMenuItem>
                        <DropdownMenuItem>Delete transaction</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground flex justify-between">
              <AccountBadge account={transaction.account} size="sm" />
              <span>{transaction.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListItem;
