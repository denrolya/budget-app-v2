import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  CreditCard,
  DollarSign,
  Home,
  List,
  LogOut,
  Monitor,
  Moon,
  MoreHorizontal,
  PieChart,
  Plus,
  Receipt,
  Sun,
} from 'lucide-react';
import cn from 'classnames';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import ExchangeRatesPresets from '@/components/common/ExchangeRatesPresets';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm, FormType } from '@/contexts/Form';
import { useTheme } from '@/contexts/theme';
import DraftTransactionForm from '@/components/features/transactions/DraftForm';

interface Props {
  className?: string;
}

export const MobileNavigation: React.FC<Props> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const { openForm } = useForm();
  const [currency, setCurrency] = useState('USD');
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/ledger', icon: Receipt, label: 'Ledger' },
    { path: '/transactions', icon: CreditCard, label: 'Transactions' },
  ];

  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border z-10', className)}>
      <div className="max-w-screen-xl mx-auto relative">
        <div className="flex justify-between items-center">
          <ul className="flex justify-start flex-1">
            {navItems.map((item) => (
              <li key={item.path} className="flex-1 relative">
                <Link
                  to={item.path}
                  className="flex flex-col items-center justify-center w-full py-2 text-muted-foreground"
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                  {location.pathname === item.path && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      layoutId="activeRoute"
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 50,
                      }}
                    />
                  )}
                </Link>
              </li>
            ))}
            <li className="flex-1">
              <Drawer>
                <DrawerTrigger asChild>
                  <button className="flex flex-col items-center justify-center w-full py-2 text-muted-foreground">
                    <MoreHorizontal className="h-6 w-6" />
                    <span className="text-xs mt-1">More</span>
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="text-left">
                    <DrawerTitle>More...</DrawerTitle>
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
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <DraftTransactionForm>
              <Button
                className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg"
                aria-label="New draft transaction"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DraftTransactionForm>
          </div>
        </div>
      </div>
    </nav>
  );
};
