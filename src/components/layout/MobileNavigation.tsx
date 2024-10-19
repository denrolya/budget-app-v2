import cn from 'classnames';
import { LogOut, Monitor, Moon, MoreHorizontal, Plus, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import ExchangeRatesPresets from '@/components/common/ExchangeRatesPresets';
import DraftTransactionForm from '@/components/features/transactions/DraftForm';
import { CurrencyButtonSelector } from '@/components/layout/CurrencyButtonSelector.tsx';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/contexts/theme';

type RouteKey = keyof typeof ROUTES

interface Props {
  className?: string;
}

export const MobileNavigation: React.FC<Props> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const navItems = [ROUTES.DASHBOARD, ROUTES.DAILY_LEDGER, ROUTES.TRANSACTION_LIST];

  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border z-10 h-12', className)}>
      <div className="max-w-screen-xl mx-auto h-full relative">
        <ul className="flex justify-between items-center h-full">
          {navItems.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li className="flex-1 h-full" key={item.path}>
                <Link
                  className="flex flex-col items-center justify-center w-full h-full text-muted-foreground"
                  to={item.path}>
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
            <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <button className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">More</span>
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="sr-only">
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
                        {(Object.keys(ROUTES) as RouteKey[]).map((key) => {
                          const Icon = ROUTES[key].icon;
                          return (
                            <Button asChild variant="ghost" className="w-full justify-start" key={key}>
                              <Link to={ROUTES[key].path}>
                                <Icon className="mr-2 h-4 w-4" />
                                {ROUTES[key].label}
                              </Link>
                            </Button>
                          );
                        })}
                      </div>
                    </TabsContent>
                    <TabsContent value="exchangeRates" className="p-0">
                      <ScrollArea className="mt-4">
                        <ExchangeRatesPresets />
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="settings">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">
                            Currency
                          </h3>
                          <CurrencyButtonSelector />
                        </div>
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

MobileNavigation.displayName = 'MobileNavigation';

export default MobileNavigation;
