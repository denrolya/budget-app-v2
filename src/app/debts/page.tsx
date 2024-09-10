import cn from 'classnames';
import { ArrowUpDown, ChevronLeft, Download, Edit, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for demonstration
const debtsData = [
  {
    id: 1,
    debtor: 'John Doe',
    created: '2023-06-15T10:30:00',
    balance: 500,
    notes: 'Personal loan for car repair',
    transactions: [
      { id: 1, date: '2023-06-15', amount: 1000, type: 'Lend' },
      { id: 2, date: '2023-07-01', amount: -250, type: 'Repayment' },
      { id: 3, date: '2023-08-01', amount: -250, type: 'Repayment' },
    ],
    history: [
      { id: 1, date: '2023-06-15', action: 'Debt created', details: 'Initial loan of $1000' },
      { id: 2, date: '2023-07-01', action: 'Repayment received', details: 'Repayment of $250' },
      { id: 3, date: '2023-08-01', action: 'Repayment received', details: 'Repayment of $250' },
    ],
  },
  {
    id: 2,
    debtor: 'Jane Smith',
    created: '2023-05-20T14:45:00',
    balance: -200,
    notes: 'Borrowed for groceries',
    transactions: [
      { id: 1, date: '2023-05-20', amount: -200, type: 'Borrow' },
    ],
    history: [
      { id: 1, date: '2023-05-20', action: 'Debt created', details: 'Borrowed $200 for groceries' },
    ],
  },
];

export default function DebtManagementPage() {
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('transactions');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedDebt = selectedDebtId ? debtsData.find(debt => debt.id === selectedDebtId) : null;

  const DebtList = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Debts</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search debts" className="pl-8" />
        </div>
      </div>
      <ScrollArea className="flex-grow">
        {debtsData.map((debt) => (
          <div
            key={debt.id}
            className={cn('p-4 border-b cursor-pointer hover:bg-accent hover:text-accent-foreground', {
              'bg-accent text-accent-foreground': selectedDebtId === debt.id,
            })}
            onClick={() => setSelectedDebtId(debt.id)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{debt.debtor}</h3>
              <Badge variant={debt.balance > 0 ? 'destructive' : 'secondary'}>
                ${Math.abs(debt.balance).toFixed(2)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{debt.notes}</p>
          </div>
        ))}
      </ScrollArea>
    </div>
  );

  const DebtDetail = () => (
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
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt={selectedDebt?.debtor} />
                  <AvatarFallback>{selectedDebt?.debtor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedDebt?.debtor}</CardTitle>
                  <CardDescription>Created
                                   on {new Date(selectedDebt?.created ?? '').toLocaleDateString()}</CardDescription>
                </div>
              </div>
              <Badge variant={selectedDebt?.balance && selectedDebt.balance > 0 ? 'destructive' : 'secondary'}
                     className="self-start">
                ${Math.abs(selectedDebt?.balance ?? 0).toFixed(2)} {selectedDebt?.balance && selectedDebt.balance > 0 ? 'Owed' : 'Overpaid'}
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
                <CardDescription>List of all transactions related to this debt</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <ul className="space-y-4">
                    {selectedDebt?.transactions.map((transaction) => (
                      <li key={transaction.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{transaction.type}</p>
                          <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={transaction.amount > 0 ? 'destructive' : 'secondary'}>
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </Badge>
                      </li>
                    ))}
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
                <CardDescription>Timeline of actions and changes related to this debt</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <ul className="space-y-4">
                    {selectedDebt?.history.map((event) => (
                      <li key={event.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-muted-foreground">{event.details}</p>
                        </div>
                        <Badge variant="secondary">{new Date(event.date).toLocaleDateString()}</Badge>
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
          <DebtList />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isMobile ? (
          selectedDebtId ? <DebtDetail /> : <DebtList />
        ) : (
          selectedDebtId ? <DebtDetail /> :
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a debt to view details
            </div>
        )}
      </div>
    </div>
  );
}
