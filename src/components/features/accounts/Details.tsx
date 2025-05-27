import cn from 'classnames';
import { AlertCircle, ArrowUpDown, Plus } from 'lucide-react';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import AccountAvatar from '@/components/features/accounts/Avatar';
import DailyList from '@/components/features/daily-ledger/DailyList';
import TableListing from '@/components/features/daily-ledger/TableListing';
import TableListingSkeleton from '@/components/features/daily-ledger/TableListingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactionsAndTransfers } from '@/hooks/useTransactionsAndTransfers';
import Account from '@/models/Account';

interface Props {
  account: Account;
}

const AccountDetail: React.FC<Props> = ({ account }) => {
  const isMobile = useIsMobile();
  const { openForm } = useFormContext();
  const currentDate = moment().startOf('day');
  const daysPerPage = 15;
  const [activeTab, setActiveTab] = useState('activity');
  const dateRange = useMemo(() => {
    const after = currentDate.clone().subtract(daysPerPage - 1, 'days');
    const before = currentDate.clone();
    return { after, before };
  }, [currentDate]);

  const { groupedItems, isLoading, isError, error, setFilter } = useTransactionsAndTransfers({
    updateUrl: false,
    excludeTransfers: true,
  });

  useEffect(() => {
    setFilter('after', dateRange.after);
    setFilter('before', dateRange.before.clone().endOf('day'));
  }, [dateRange, setFilter]);

  useEffect(() => {
    setFilter('accounts', [account.id]);
  }, [account, setFilter]);

  const renderActivityContent = () => {
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-2" />
          <p className="text-lg font-semibold text-destructive">Error loading transactions</p>
          <p className="text-sm text-muted-foreground">{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      );
    }

    if (!isLoading && groupedItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <p className="text-lg font-semibold">No activity found</p>
          <p className="text-sm text-muted-foreground">No transactions or transfers for the selected period.</p>
        </div>
      );
    }

    return (
      <>
        <div className="md:hidden">
          <DailyList
            isLoading={isLoading}
            groupedItems={groupedItems}
            after={dateRange.after}
            before={dateRange.before}
          />
        </div>

        <div className="hidden md:block">
          {isLoading && <TableListingSkeleton after={dateRange.after} before={dateRange.before} />}
          {!isLoading && (
            <TableListing
              isLoading={isLoading}
              groupedItems={groupedItems}
              after={dateRange.after}
              before={dateRange.before}
            />
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center space-x-4 mb-2">
            <AccountAvatar account={account} />
            <div>
              <CardTitle className="flex space-x-2 items-center">
                <span>{account.displayName}</span>
                <MoneyValue
                  badge
                  showSign
                  amount={account.balance}
                  currency={account.currency}
                  values={account.convertedValues}
                />
              </CardTitle>
              <CardDescription>
                Created: <RelativeDatetimeDisplay date={account.createdAt} />
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Notes here</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Edit Balance
          </Button>
        </CardFooter>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className={cn({
            'grid w-full grid-cols-2': isMobile,
          })}
        >
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="history">Account History</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card>
            <CardHeader className="sr-only">
              <CardTitle>Activity</CardTitle>
              <CardDescription className="sr-only">List of all transactions for past 7 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">{renderActivityContent()}</ScrollArea>
            </CardContent>
            <CardFooter className="p-4">
              <Button onClick={() => openForm(FormType.Transaction, { account })}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Account History</CardTitle>
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
                      <Badge variant="secondary">{moment(event.date).format('LLL')}</Badge>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AccountDetail;
