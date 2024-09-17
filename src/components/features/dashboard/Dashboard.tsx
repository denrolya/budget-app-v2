import { File, ListFilter, MoreHorizontal, PlusCircle } from 'lucide-react';

import { FinancialCard } from '@/components/features/statistics/financial-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from '@/contexts/Form';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';


export const Dashboard = () => {
  const { openForm } = useForm();

  const handleNewTransaction = () => {
    openForm('transaction');
  };

  const handleEditTransaction = () => {
    const existingTransaction = {
      id: 55,
      amount: 50,
      note: 'Groceries',
      type: 'expense',
      category: { id: 1, name: 'Groceries', icon: '🍎' },
      executedAt: '2023-06-15',
      account: {
        id: 2,
        name: 'Savings',
      },
    };
    openForm('transaction', existingTransaction, true);
  };

  return (
    <section className="p-6">
      <div className="w-full mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-6">
          <Button onClick={() => openForm('account')}>New Account</Button>

          <Button onClick={handleNewTransaction}>New Transaction</Button>

          <Button onClick={handleEditTransaction}>Edit Transaction</Button>

          <Button onClick={() => openForm('transfer')}>New Transfer</Button>
        </div>
        <MoneyFlow />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 justify-items-center mb-6">
        <FinancialCard />
        <FinancialCard />
        <FinancialCard />
        <FinancialCard />
        <FinancialCard />
        <FinancialCard />
      </div>
    </section>
  );
};
