import { Bike, LogOut, Monitor, Moon, MoreHorizontal, Plus, Sun } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

import ExchangeRatesPresets from '@/components/common/ExchangeRatesPresets';
import CurrencyButtonSelector from '@/components/layout/header/CurrencyButtonSelector';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/routes';
import { Theme, useTheme } from '@/contexts/theme';
import { useAuth } from '@/features/auth';
import { TransactionDraftForm } from '@/features/transactions';
import { cn } from '@/lib/utils';

type RouteKey = keyof typeof ROUTES;
type TabKey = 'quickAccess' | 'exchangeRates' | 'settings';

interface Props {
  className?: string;
}

const NavItem: React.FC<{
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}> = ({ to, label, Icon, isActive }) => (
  <li className="flex-1 h-full">
    <Link
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      to={to}
      className={cn(
        'flex flex-col items-center justify-center w-full h-full',
        'text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
    >
      <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
      <span className={cn('text-[10px] mt-0.5', isActive && 'text-primary')}>{label}</span>
    </Link>
  </li>
);

export const MobileNavigation: React.FC<Props> = ({ className }) => {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('quickAccess');

  const tabOptions: TabKey[] = useMemo(() => ['quickAccess', 'exchangeRates', 'settings'], []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDrawerOpen) setActiveTab('quickAccess');
  }, [isDrawerOpen]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const idx = tabOptions.indexOf(activeTab);
      if (idx < tabOptions.length - 1) {
        setActiveTab(tabOptions[idx + 1]);
      }
    },
    onSwipedRight: () => {
      const idx = tabOptions.indexOf(activeTab);
      if (idx > 0) {
        setActiveTab(tabOptions[idx - 1]);
      }
    },
    trackMouse: false,
  });

  const navItems = useMemo(() => [ROUTES.DASHBOARD, ROUTES.LEDGER], []);

  const pathname = location.pathname;

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 md:hidden z-10 h-12',
        'bg-background border-t border-border',
        className,
      )}
    >
      <div className="max-w-screen-xl mx-auto h-full relative">
        <ul className="flex justify-between items-center h-full">
          {navItems.slice(0, 2).map((item) => (
            <NavItem
              Icon={item.icon}
              isActive={pathname === item.path}
              label={item.label}
              to={item.path}
              key={item.path}
            />
          ))}

          {/* Center FAB */}
          <li className="flex-1 h-full flex items-center justify-center">
            <TransactionDraftForm>
              <Button
                aria-label="Create draft transaction"
                type="button"
                className={cn(
                  'w-14 h-14 rounded-full -mt-8 shadow-lg',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              >
                <Plus aria-hidden="true" className="h-6 w-6" />
              </Button>
            </TransactionDraftForm>
          </li>

          {navItems.slice(2).map((item) => (
            <NavItem
              Icon={item.icon}
              isActive={pathname === item.path}
              label={item.label}
              to={item.path}
              key={item.path}
            />
          ))}

          {/* More */}
          <li className="flex-1 h-full">
            <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  aria-expanded={isDrawerOpen}
                  aria-haspopup="dialog"
                  aria-label="More"
                  type="button"
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-full',
                    'text-muted-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  )}
                >
                  <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">More</span>
                </button>
              </DrawerTrigger>

              <DrawerContent aria-label="More options">
                <DrawerHeader className="sr-only">
                  <DrawerTitle>More options</DrawerTitle>
                </DrawerHeader>

                <div className="p-4" {...swipeHandlers}>
                  <Tabs value={activeTab} className="w-full" onValueChange={(v) => setActiveTab(v as TabKey)}>
                    <TabsList aria-label="More tabs" className="grid w-full grid-cols-3">
                      <TabsTrigger value="quickAccess">Quick</TabsTrigger>
                      <TabsTrigger value="exchangeRates">Rates</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="quickAccess">
                      <div className="space-y-2 mt-3">
                        {(Object.keys(ROUTES) as RouteKey[]).map((key) => {
                          const route = ROUTES[key];
                          const Icon = route.icon;
                          const isActive = pathname === route.path;

                          return (
                            <Button
                              asChild
                              variant="ghost"
                              className={cn('w-full justify-start', isActive && 'bg-accent')}
                              key={key}
                            >
                              <Link aria-current={isActive ? 'page' : undefined} to={route.path}>
                                <Icon aria-hidden="true" className="mr-2 h-4 w-4" />
                                {route.label}
                              </Link>
                            </Button>
                          );
                        })}
                      </div>
                    </TabsContent>

                    <TabsContent value="exchangeRates" className="p-0">
                      <ScrollArea aria-label="Exchange rate presets" className="mt-4 h-[55vh]">
                        <ExchangeRatesPresets />
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="settings">
                      <div className="space-y-4 mt-3">
                        <section aria-label="Currency">
                          <h3 className="text-sm font-medium mb-2">Currency</h3>
                          <CurrencyButtonSelector />
                        </section>

                        <section aria-label="Theme">
                          <h3 className="text-sm font-medium mb-2">Theme</h3>
                          <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger aria-label="Select theme" className="w-full">
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Theme.Dark}>
                                <div className="flex items-center">
                                  <Moon aria-hidden="true" className="mr-2 h-4 w-4" />
                                  Dark
                                </div>
                              </SelectItem>

                              <SelectItem value={Theme.Light}>
                                <div className="flex items-center">
                                  <Sun aria-hidden="true" className="mr-2 h-4 w-4" />
                                  Light
                                </div>
                              </SelectItem>

                              <SelectItem value={Theme.System}>
                                <div className="flex items-center">
                                  <Monitor aria-hidden="true" className="mr-2 h-4 w-4" />
                                  System
                                </div>
                              </SelectItem>

                              <SelectItem value={Theme.TronDark}>
                                <div className="flex items-center">
                                  <Bike aria-hidden="true" className="mr-2 h-4 w-4" />
                                  Tron Dark
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </section>

                        <Button aria-label="Logout" variant="destructive" className="w-full" onClick={logout}>
                          <LogOut aria-hidden="true" className="mr-2 h-4 w-4" />
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
