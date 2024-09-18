import cn from 'classnames';
import { Building2, Banknote, Globe, HelpCircle, Archive, Calendar, ArrowUpDown, ChevronLeft, Download, Edit, Plus, Search } from 'lucide-react';
import moment from 'moment';
import { useEffect, useState } from 'react';

import { ListItem } from '@/components/features/transactions/ListItem.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MOMENT_DATE_VIEW_FORMAT, MOMENT_DATETIME_VIEW_FORMAT } from '@/constants/datetime.ts';
import { useAccountsWithDefaultOrder } from '@/contexts/FinanceData';
import { generateTransactions } from '@/services/transactionGenerator.ts';

interface Account {
  id: number
  name: string
  balance: number
  currency: string
  type: 'bank' | 'cash' | 'internet' | 'other'
  color: string
  isDisplayedOnSidebar: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export const AccountsManagementPage = () => {
  const accounts = useAccountsWithDefaultOrder();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('transactions');
  const [isMobile, setIsMobile] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const getIconComponent = (type: Account['type']) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-4 h-4" />;
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'internet':
        return <Globe className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedAccount = selectedAccountId ? accounts.find(account => account.id === selectedAccountId) : null;

  const AccountList = () => (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-2">Accounts</h2>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search accounts" className="pl-8" />
          </div>
        </div>
        <ScrollArea className="flex-grow">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={cn('p-4 border-b cursor-pointer hover:bg-accent hover:text-accent-foreground', {
                'bg-accent text-accent-foreground': selectedAccountId === account.id,
              })}
              onClick={() => setSelectedAccountId(account.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: account.color }}>
                    {getIconComponent(account.icon)}
                  </div>
                  <h3 className="font-medium">{account.name}</h3>
                </div>
                <Badge variant={account.balance > 0 ? 'default' : 'secondary'}>
                  {account.currency} {Math.abs(account.balance).toFixed(2)}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{account.type}</span>
                {account.archivedAt && (
                  <span className="flex items-center gap-1">
                <Archive className="w-3 h-3" />
                Archived
              </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Last updated: {new Date(account.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          <div className="p-4">
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </button>
          </div>
        </ScrollArea>
      </div>
    );

  const AccountDetail = () => (
    <div className="h-full flex flex-col">
      <header className="bg-background border-b p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => setSelectedAccountId(null)}>
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
            <div className="flex flex-col">
              <div className="flex items-center space-x-4 mb-2">
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt={selectedAccount?.name} />
                  <AvatarFallback>{selectedAccount?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedAccount?.name}</CardTitle>
                  <CardDescription>Created
                                   on {moment(selectedAccount?.createdAt).format(MOMENT_DATETIME_VIEW_FORMAT)}</CardDescription>
                </div>
              </div>
              <Badge variant={selectedAccount?.balance && selectedAccount.balance > 0 ? 'destructive' : 'secondary'}
                     className="self-start">
                ${Math.abs(selectedAccount?.balance ?? 0).toFixed(2)} {selectedAccount?.balance && selectedAccount.balance > 0 ? 'Owed' : 'Overpaid'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{selectedAccount?.notes}</p>
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
                  <ul className="space-y-4">
                    {
                      generateTransactions(5).map((transaction) => (
                        <ListItem key={transaction.id} transaction={transaction} />
                      ))
                    }
                  </ul>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button>
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      {!isMobile && (
        <div className="w-80 border-r bg-background">
          <AccountList />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isMobile ? (
          selectedAccountId ? <AccountDetail /> : <AccountList />
        ) : (
          selectedAccountId ? <AccountDetail /> :
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a account to view details
            </div>
        )}
      </div>
    </div>
  );
};
