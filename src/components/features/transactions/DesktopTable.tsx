import moment from 'moment';
import React from 'react';
import { Pencil } from 'lucide-react';

import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime.ts';
import { Badge } from '@/components/ui/badge';
import MoneyValue from '@/components/common/MoneyValue';
import { useBaseCurrency } from '@/contexts/auth';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import TransactionValue from '@/components/common/TransactionValue';
import AccountBadge from '@/components/features/accounts/Badge';
import Details from '@/components/features/transactions/Details';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import Transaction from '@/models/Transaction';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  groupedTransactions: [string, Transaction[]][];
}

export const DesktopTable: React.FC<Props> = ({ groupedTransactions, ...props }) => {
  const { openForm } = useFormContext();
  const baseCurrency = useBaseCurrency();

  const calculateTotalValue = (transactions: Transaction[]) => transactions
    .filter(t => !t.isTransfer())
    .reduce((total, transaction) => {
      const value = transaction.isIncome() ? transaction.convertedValues[baseCurrency] : -transaction.convertedValues[baseCurrency];
      return total + value;
    }, 0);

  return (
    <Table {...props}>
      <TableHeader className="sr-only">
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupedTransactions.map(([date, transactions]) => (
          <React.Fragment key={date}>
            <TableRow>
              <TableCell colSpan={8} className="font-semibold bg-muted">
                <div className="flex justify-between items-center">
                  <RelativeDatetimeDisplay showTime={false} date={moment(date)} />
                  <div className="text-sm font-normal">
                    <span className="mr-4">{transactions.length} transactions</span>
                    <span>Total: <MoneyValue className="font-medium font-mono" amount={calculateTotalValue(transactions)} /></span>
                  </div>
                </div>
              </TableCell>
            </TableRow>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell></TableCell>
                <TableCell>
                  <Sheet>
                    <SheetTrigger className="m-0 cursor-help" asChild>
                      <code>#{transaction.id}</code>
                    </SheetTrigger>
                    <SheetContent className="max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                      <SheetHeader>
                        <SheetTitle>Transaction Details</SheetTitle>
                      </SheetHeader>
                      <Details transaction={transaction} />
                    </SheetContent>
                  </Sheet>
                </TableCell>
                <TableCell>
                  <AccountBadge account={transaction.account} size="sm" />
                </TableCell>
                <TableCell>
                  <TransactionValue transaction={transaction} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-xs px-1 py-0 whitespace-nowrap bg-background shadow-md"
                  >
                    {transaction.category.name}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.note}</TableCell>
                <TableCell>{moment(transaction.executedAt).format(MOMENT_TIME_VIEW_FORMAT)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openForm(FormType.Transaction, transaction)}
                    aria-label="Edit"
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};

export default DesktopTable;
