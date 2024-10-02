import MoneyValue from '@/components/common/MoneyValue';
import { Pagination } from '@/components/common/Pagination';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import AccountAvatar from '@/components/features/accounts/Avatar';
import TransactionListItemV3, {
  ListItemSkeleton as TransactionListItemSkeletonV3,
} from '@/components/features/transactions/ListItemV3';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactions } from '@/hooks/useTransactions';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction.ts';
import { TransactionFilters } from '@/models/TransactionFilters';
import { ArrowUpDown, ChevronLeft, Download, Edit, Plus } from 'lucide-react';
import moment from 'moment/moment';
import React, { useEffect, useMemo, useState } from 'react';

interface Props {
  account: Account;
  setSelectedAccount: (account: Account | null) => void;
}

const AccountDetail: React.FC<Props> = ({ account, setSelectedAccount }) => {
  const { openForm } = useFormContext();
  const [activeTab, setActiveTab] = useState('transactions');
  let balanceBadgeVariant: BadgeVariant = BadgeVariant.Secondary;
  if (account.balance < 0) {
    balanceBadgeVariant = BadgeVariant.Destructive;
  } else if (account.balance > 0) {
    balanceBadgeVariant = BadgeVariant.Success;
  }
  const {
    transactions,
    isLoading,
    isError,
    error,
    refetch,
    pagination: { currentPage, totalPages, perPage, setCurrentPage },
    filters,
    setFilter,
    isFetching,
  } = useTransactions({
    initialFilters: new TransactionFilters({ accounts: [account.id] }),
  });

  const groupedAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];

    const grouped = transactions.reduce((groups, transaction) => {
      const date = moment(transaction.executedAt).format('YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => moment(dateB).diff(moment(dateA)))
      .map(([date, transactions]) => ({
        date,
        transactions: transactions.sort((a, b) =>
          moment(b.executedAt).diff(moment(a.executedAt)),
        ),
      }));
  }, [transactions]);

  const formatTransactionDate = (dateString: string): string => {
    const RECENT_THRESHOLD_DAYS = 7;
    const transactionDate = moment(dateString);
    const now = moment();

    const diffInDays = now.diff(transactionDate, 'day');

    const formattedDate = transactionDate.format('MMM D, YYYY'); // e.g., "Sep 16, 2024"

    if (diffInDays < RECENT_THRESHOLD_DAYS) {
      const relativeTime = transactionDate.fromNow(); // e.g., "3 days ago"
      return `${relativeTime} (${formattedDate})`; // e.g., "3 days ago (Sep 20, 2024)"
    } else {
      return formattedDate;
    }
  };

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
                  <span>
                    {account.nameWithCurrency}
                  </span>
                  <MoneyValue
                    badge
                    showSign
                    amount={account.balance}
                    currency={account.currency}
                    values={account.convertedValues} />
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
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="history">Account History</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>List of all transactions related to this account</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <>
                    {isLoading && (
                      <ul className="space-y-2">
                        {[...Array(perPage)].map((_, index) => (
                          <li key={index}><TransactionListItemSkeletonV3 /></li>
                        ))}
                      </ul>
                    )}

                    {(!isLoading && !isError && transactions) && (
                      <>
                        {groupedAndSortedTransactions.length > 0 && (
                          <>
                            {groupedAndSortedTransactions.map(({ date, transactions }) => (
                              <div key={date} className="mb-6">
                                <h5 className="text-lg font-semibold mb-2">{formatTransactionDate(date)}</h5>
                                <ul className="space-y-2">
                                  {transactions.map((transaction: Transaction) => (
                                    <li key={transaction.id} className="relative">
                                      <TransactionListItemV3 transaction={transaction} />
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button onClick={() => openForm(FormType.Transaction, { account })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
                <Pagination currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage} />
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
