import cn from 'classnames';
import { Archive, ArrowUpDown, Calendar, ChevronLeft, Download, Edit, Plus, Search } from 'lucide-react';
import moment from 'moment';
import { useEffect, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import DebtAvatar from '@/components/features/accounts/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MOMENT_DATE_VIEW_FORMAT, MOMENT_DATETIME_VIEW_FORMAT } from '@/constants/datetime';
import { useDebts } from '@/contexts/FinanceData';

export const DebtsManagementPage = () => {
  const debts = useDebts();
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('transactions');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedDebt = selectedDebtId ? debts.find(account => account.id === selectedDebtId) : null;

  const DebtList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Debts</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search accounts" className="pl-8" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className={cn('p-4 border-b cursor-pointer hover:bg-accent hover:text-accent-foreground', {
              'bg-accent text-accent-foreground': selectedDebtId === debt.id,
            })}
            onClick={() => setSelectedDebtId(debt.id)}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{debt.debtor}</h3>
              </div>
              <Badge variant={debt.balance > 0 ? 'default' : 'secondary'}>
                <MoneyValue
                  amount={debt.balance}
                  currency={debt.currency}
                  values={debt.convertedValues} />
              </Badge>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              {debt.closedAt && (
                <span className="flex items-center gap-1">
                <Archive className="w-3 h-3" />
                Closed
              </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3 inline mr-1" />
              Last updated: {moment(debt.updatedAt).fromNow()}
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

  const DebtDetail = () => {
    let balanceBadgeVariant = 'secondary';
    if (selectedDebt?.balance && selectedDebt.balance < 0) {
      balanceBadgeVariant = 'destructive';
    } else if (selectedDebt?.balance && selectedDebt.balance > 0) {
      balanceBadgeVariant = 'default';
    }

    return (
      <div className="h-full flex flex-col">
        <header className="bg-background border-b p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => setSelectedDebtId(null)}>
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Back to list</span>
            </Button>
            <h1 className="text-xl font-bold">Debt Details</h1>
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
                  <div>
                    <CardTitle>{selectedDebt?.debtor}</CardTitle>
                    <CardDescription>
                      Created on {moment(selectedDebt?.createdAt).format(MOMENT_DATETIME_VIEW_FORMAT)}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="self-start" variant={balanceBadgeVariant}>
                  <MoneyValue
                    amount={selectedDebt.balance}
                    currency={selectedDebt.currency}
                    values={selectedDebt.convertedValues} />
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{selectedDebt?.notes}</p>
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
                <CardHeader>
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription>List of all transactions related to this account</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <ul className="space-y-4">
                      <li>transaction 1</li>
                      <li>transaction 2</li>
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

  return (
    <div className="flex h-screen md:h-[calc(100vh-2rem)] overflow-hidden pb-16 md:pb-0">
      {/* Sidebar for desktop */}
      {!isMobile && (
        <div className="w-80 border-r bg-background">
          <DebtList />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {isMobile ? (
          selectedDebtId ? <DebtDetail /> : <DebtList />
        ) : (
          selectedDebtId ? <DebtDetail /> :
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a account to view details
            </div>
        )}
      </div>
    </div>
  );
};

export default DebtsManagementPage;
