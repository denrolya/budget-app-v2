import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import { ArrowUpDown, Plus } from 'lucide-react';
import moment, { Moment } from 'moment/moment';
import React, { useMemo, useState } from 'react';

import { useIsMobile } from '@/hooks/useMobile';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { MoneyValue } from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import List from '@/components/features/transactions/List';
import TableListing from '@/components/features/transactions/TableListing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BACKEND_DATE_FORMAT, MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import Debt from '@/models/Debt';
import Transaction from '@/models/Transaction';

interface Props {
  debt: Debt;
}

const DebtDetails: React.FC<Props> = ({ debt }) => {
  const [activeTab, setActiveTab] = useState('transactions');
  const { openForm } = useFormContext();
  const baseCurrency = useBaseCurrency();
  const isMobile = useIsMobile();

  const groupedTransactions: [Moment, Transaction[], number, number][] = useMemo(
    () =>
      toPairs(
        groupBy(
          sortBy(debt.transactions, (item) => -item.executedAt.valueOf()),
          (item) => item.executedAt.format(BACKEND_DATE_FORMAT),
        ),
      ).map(([date, items]) => {
        const totalValue = sumBy(items, (item) => {
          const value = item.convertedValues[baseCurrency] || 0;
          return item.isExpense() ? -value : value;
        });
        const totalItems = items.length;
        return [moment(date), items, totalValue, totalItems];
      }),
    [debt.transactions, baseCurrency],
  );

  const totalTransactionsValue = groupedTransactions.reduce((acc, [, , totalValue]) => acc + totalValue, 0);
  const totalTransactionsCount = debt.transactions.length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex flex-row justify-between items-center">
              <span>{debt?.debtor}</span>
              <MoneyValue badge amount={debt.balance} currency={debt.currency} values={debt.convertedValues} />
            </CardTitle>
            <CardDescription>
              <p>
                Opened on <RelativeDatetimeDisplay date={debt.createdAt} />
              </p>
              <p>
                {totalTransactionsCount} transactions{' '}
                {totalTransactionsCount > 0 && (
                  <>
                    of total value: <MoneyValue showSign amount={totalTransactionsValue} currency={debt.currency} />
                  </>
                )}
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{debt?.note}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Edit Balance
            </Button>
          </CardFooter>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={isMobile ? 'grid w-full grid-cols-2' : ''}>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="history">Debt History</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions">
            <Card>
              <CardHeader className="sr-only">
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  {totalTransactionsCount} transactions of total value <MoneyValue amount={totalTransactionsValue} />
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
                  {groupedTransactions.length > 0 && (
                    <>
                      <div className="hidden md:block">
                        <TableListing groupedItems={groupedTransactions} />
                      </div>
                      <div className="md:hidden">
                        <List groupedItems={groupedTransactions} />
                      </div>
                    </>
                  )}
                  {groupedTransactions.length === 0 && <p>No transactions registered yet</p>}
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-4">
                <Button onClick={() => openForm(FormType.Transaction, { debt })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Debt History</CardTitle>
                <CardDescription>Timeline of actions and changes related to this account</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <ul className="space-y-4">
                    {[
                      { id: 1, date: '2023-06-15', action: 'Debt created', details: 'Initial loan of $1000' },
                      { id: 2, date: '2023-07-01', action: 'Repayment received', details: 'Repayment of $250' },
                      { id: 3, date: '2023-08-01', action: 'Repayment received', details: 'Repayment of $250' },
                    ].map((event) => (
                      <li key={event.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-muted-foreground">{event.details}</p>
                        </div>
                        <Badge variant="secondary">{moment(event.date).format(MOMENT_DATE_VIEW_FORMAT)}</Badge>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DebtDetails;
