import cn from 'classnames';
import {
  Home,
  Receipt,
  CreditCard,
  MoreHorizontal,
  Plus,
  Airplay,
  ArrowLeftRight,
  DollarSign,
  List,
  LogOut,
  Monitor,
  Moon,
  PieChart,
  Sun,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import ExchangeRatesPresets from '@/components/common/ExchangeRatesPresets';
import DraftTransactionForm from '@/components/features/transactions/DraftForm';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/routes.ts';
import { useTheme } from '@/contexts/theme';

interface Props {
  className?: string;
}

export const MobileNavigation: React.FC<Props> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const [currency, setCurrency] = useState('USD');
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/ledger', icon: Receipt, label: 'Ledger' },
    { path: '/transactions', icon: CreditCard, label: 'Transactions' },
  ];

  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border z-10 h-12', className)}>
      <div className="max-w-screen-xl mx-auto h-full relative">
        <ul className="flex justify-between items-center h-full">
          {navItems.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="flex-1 h-full">
                <Link
                  to={item.path}
                  className="flex flex-col items-center justify-center w-full h-full text-muted-foreground"
                >
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-[10px] mt-0.5', isActive ? 'text-primary' : 'text-muted-foreground')}>{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1 h-full flex items-center justify-center">
            <DraftTransactionForm>
              <Button
                className="w-14 h-14 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 shadow-lg -mt-8"
                aria-label="New draft transaction"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DraftTransactionForm>
          </li>
          {navItems.slice(2).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="flex-1 h-full">
                <Link
                  to={item.path}
                  className="flex flex-col items-center justify-center w-full h-full text-muted-foreground"
                >
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-[10px] mt-0.5', isActive ? 'text-primary' : 'text-muted-foreground')}>{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1 h-full">
            <Drawer>
              <DrawerTrigger asChild>
                <button className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">More</span>
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle>More options</DrawerTitle>
                </DrawerHeader>
                <div className="p-4">
                  <Tabs defaultValue="quickAccess" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="quickAccess">Quick Access</TabsTrigger>
                      <TabsTrigger value="exchangeRates">Rates</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="quickAccess">
                      <div className="space-y-4">
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to="/accounts">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Accounts
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to="/debts">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Debts
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to="/transfers">
                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                            Transfers
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to={ROUTES.TESTING_PAGE.path}>
                            <Airplay className="mr-2 h-4 w-4" />
                            Categories
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to="/reports">
                            <PieChart className="mr-2 h-4 w-4" />
                            Reports
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to="/categories">
                            <List className="mr-2 h-4 w-4" />
                            Categories
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to="/testing">
                            <Airplay className="mr-2 h-4 w-4" />
                            Test page
                          </Link>
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="exchangeRates">
                      <ScrollArea className="mt-4">
                        <ExchangeRatesPresets />
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="settings">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Theme</label>
                          <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dark">
                                <div className="flex items-center">
                                  <Moon className="mr-2 h-4 w-4" />
                                  Dark
                                </div>
                              </SelectItem>
                              <SelectItem value="light">
                                <div className="flex items-center">
                                  <Sun className="mr-2 h-4 w-4" />
                                  Light
                                </div>
                              </SelectItem>
                              <SelectItem value="system">
                                <div className="flex items-center">
                                  <Monitor className="mr-2 h-4 w-4" />
                                  System
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Currency</label>
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="destructive" className="w-full">
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </DrawerContent>
            </Drawer>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default MobileNavigation;
