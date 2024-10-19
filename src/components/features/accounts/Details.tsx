import { AlertCircle, ArrowUpDown, ChevronLeft, Download, Edit, Plus } from 'lucide-react';
import moment from 'moment/moment';
import React, { useEffect, useMemo, useState } from 'react';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime.ts';
import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import AccountAvatar from '@/components/features/accounts/Avatar';
import TransactionListItem, { ListItemSkeleton as TransactionListItemSkeleton } from '@/components/features/transactions/ListItemV3';
import TransferListItem, { ListItemSkeleton as TransferListItemSkeleton } from '@/components/features/transfers/ListItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactionsAndTransfers } from '@/hooks/useTransactionsAndTransfers';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';

interface Props {
  account: Account;
  setSelectedAccount: (account: Account | null) => void;
}

const AccountDetail: React.FC<Props> = ({ account, setSelectedAccount }) => {
  const { openForm } = useFormContext();
  const currentDate = moment().startOf('day');
  const daysPerPage = 15;
  const [activeTab, setActiveTab] = useState('activity');
  const dateRange = useMemo(() => {
    const startDate = currentDate.clone().subtract(daysPerPage - 1, 'days');
    const endDate = currentDate.clone();
    return { startDate, endDate };
  }, [currentDate]);

  const {
    groupedItems,
    isLoading,
    isError,
    error,
    setFilter,
  } = useTransactionsAndTransfers({
    updateUrl: false,
    excludeTransfers: true,
  });

  useEffect(() => {
    setFilter('after', dateRange.startDate);
    setFilter('before', dateRange.endDate.clone().endOf('day'));
  }, [dateRange, setFilter]);

  useEffect(() => {
    setFilter('accounts', [account.id]);
  }, [account, setFilter]);

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderActivityContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-5 bg-muted rounded w-1/4"></div>
              <TransactionListItemSkeleton />
              <TransferListItemSkeleton />
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-2" />
          <p className="text-lg font-semibold text-destructive">Error loading transactions</p>
          <p className="text-sm text-muted-foreground">{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      );
    }

    if (groupedItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <p className="text-lg font-semibold">No transactions found</p>
          <p className="text-sm text-muted-foreground">There are no transactions for the selected period.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {groupedItems.map(([date, items]) => (
          <div key={date.format(BACKEND_DATE_FORMAT)}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{moment(date).format('dddd, D MMM')}</h3>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  {item instanceof Transaction ? (
                    <TransactionListItem transaction={item} />
                  ) : (
                    <TransferListItem transfer={item} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <header className="bg-background border-b p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => setSelectedAccount(null)}>
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back to list</span>
          </Button>
          <h1 className="text-xl font-bold">Account Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-4">
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center space-x-4 mb-2">
              <AccountAvatar account={account} />
              <div>
                <CardTitle className="flex space-x-2 items-center">
                  <span>{account.nameWithCurrency}</span>
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
          <TabsList className={isMobile ? 'grid w-full grid-cols-2' : ''}>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="history">Account History</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription className="sr-only">List of all transactions for past 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {renderActivityContent()}
                </ScrollArea>
              </CardContent>
              <CardFooter>
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
      </div>
    </div>
  );
};

export default AccountDetail;
