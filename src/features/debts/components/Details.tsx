import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import { ArrowUpDown, Plus } from 'lucide-react';
import moment, { Moment } from 'moment/moment';
import React, { useMemo, useState } from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BACKEND_DATE_FORMAT, MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useBaseCurrency } from '@/features/auth';
import { FormattedListing, Transaction } from '@/features/transactions';
import { useIsMobile } from '@/hooks/use-mobile';

import Debt from '../models/Debt';

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
    // min-w-0 is critical: allows this column to shrink inside flex layouts (PageWithSidebar.Content).
    <div className="h-full min-w-0 flex flex-col">
      {/* prevent any child (table) from forcing horizontal expansion */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4">
        <Card className="mb-4 min-w-0">
          <CardHeader>
            <CardTitle className="flex items-start justify-between gap-3 min-w-0">
              <span title={debt.debtor} className="min-w-0 truncate">
                {debt.debtor}
              </span>

              {/* keep money badge from being pushed out */}
              <span className="shrink-0">
                <MoneyValue badge amount={debt.balance} currency={debt.currency} values={debt.convertedValues} />
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="min-w-0">
            <section className="border-b border-t py-4 space-y-1">
              <p className="text-xs">
                <strong>Opened on:</strong> <RelativeDatetimeDisplay date={debt.createdAt} />
              </p>
              <p className="text-xs">
                <strong>Number of Transactions:</strong> {totalTransactionsCount}
              </p>
              <p className="text-xs">
                <strong>Of total value: </strong>
                <MoneyValue showSign amount={totalTransactionsValue} currency={debt.currency} />
              </p>
            </section>

            <section className="mt-4 min-w-0">
              <h4>Note:</h4>
              <p className="text-sm text-muted-foreground break-words">{debt.note}</p>
            </section>
          </CardContent>

          <CardFooter>
            <Button size="sm" variant="outline">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Edit Balance
            </Button>
          </CardFooter>
        </Card>

        <Tabs value={activeTab} className="min-w-0" onValueChange={setActiveTab}>
          <TabsList className={isMobile ? 'grid w-full grid-cols-2' : ''}>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="history">Debt History</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="min-w-0">
            <Card className="min-w-0">
              <CardHeader className="sr-only">
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  {totalTransactionsCount} transactions of total value <MoneyValue amount={totalTransactionsValue} />
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 min-w-0 w-full">
                <ScrollArea className="h-[450px] w-full">
                  <FormattedListing
                    error={null}
                    groupedItems={groupedTransactions}
                    isError={false}
                    isLoading={false}
                    refetch={() => {
                    }}
                    onAdd={() => openForm(FormType.Transaction, { debt })} />
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

          <TabsContent value="history" className="min-w-0">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Debt History</CardTitle>
                <CardDescription>Timeline of actions and changes related to this account</CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                <ScrollArea className="h-[300px] w-full">
                  <ul className="space-y-4">
                    {[
                      { id: 1, date: '2023-06-15', action: 'Debt created', details: 'Initial loan of $1000' },
                      { id: 2, date: '2023-07-01', action: 'Repayment received', details: 'Repayment of $250' },
                      { id: 3, date: '2023-08-01', action: 'Repayment received', details: 'Repayment of $250' },
                    ].map((event) => (
                      <li className="flex items-start justify-between gap-3 min-w-0" key={event.id}>
                        <div className="min-w-0">
                          <p className="font-medium break-words">{event.action}</p>
                          <p className="text-sm text-muted-foreground break-words">{event.details}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {moment(event.date).format(MOMENT_DATE_VIEW_FORMAT)}
                        </Badge>
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
