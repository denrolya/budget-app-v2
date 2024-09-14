import cn from 'classnames';
import sumBy from 'lodash/sumBy';
import { BarChart2, CreditCard, Home, LucideIcon, Plus } from 'lucide-react';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { MoneyValue } from '@/components/common/MoneyValue';
import { Avatar as AccountAvatar } from '@/components/features/accounts/Avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth';
import { useActiveAccountsWithDefaultOrder } from '@/contexts/FinanceData';
import { useForm } from '@/contexts/form';
import { useSidebar } from '@/contexts/sidebar';

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  children: ReactNode;
}

interface Props {
  className?: string;
}

export const Sidebar: React.FC<Props> = ({ className }) => {
  const { user } = useAuth();
  const accounts = useActiveAccountsWithDefaultOrder();
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { isSidebarExpanded, setIsSidebarExpanded, toggleSidebar } = useSidebar();
  const { openForm } = useForm();

  const totalBalance = useMemo(
    () => sumBy(accounts, ({ convertedValues }) => convertedValues[user.baseCurrency] || 0),
    [accounts],
  );

  // logger.info(accounts);
  const totalDebt = 55432.42;


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsSidebarExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsSidebarExpanded(false);
    }
  };

  const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          'flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          {
            'bg-primary text-primary-foreground': isActive,
            'text-foreground': !isActive,
          },
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {isSidebarExpanded && <span className="ml-2">{children}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn('bg-background border-r border-accent flex flex-col transition-all duration-300 ease-in-out z-40',
        className,
        {
          'fixed inset-y-0 left-0 w-64': isMobile && isSidebarExpanded,
          'fixed inset-y-0 -left-64 w-64': isMobile && !isSidebarExpanded,
          'w-64': !isMobile && isSidebarExpanded,
          'w-16': !isMobile && !isSidebarExpanded,
        },
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 p-4 space-y-4">
          <div className="space-y-1">
            <NavLink to="/dashboard" icon={Home}>
              Dashboard
            </NavLink>
            <NavLink to="/ledger" icon={BarChart2}>
              Daily Ledger
            </NavLink>
          </div>
          <Separator />
          <div className="space-y-1">
            {isSidebarExpanded && (
              <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Tools</div>
            )}
            <NavLink to="/transactions" icon={CreditCard}>
              Transactions
            </NavLink>
            <NavLink to="/transfers" icon={CreditCard}>
              Transfers
            </NavLink>
            <NavLink to="/accounts" icon={CreditCard}>
              Accounts
            </NavLink>
            <NavLink to="/debts" icon={CreditCard}>
              Debts
            </NavLink>
          </div>
        </div>

        <Separator />

        {isSidebarExpanded && (
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="text-xs font-semibold text-accent-foreground/60 px-6 py-2">Recent Accounts</div>
            <ScrollArea className="flex-grow px-4">
              <div className="space-y-1">
                {accounts.map((account) => (
                  <Tooltip key={account.id}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground space-x-3 p-2 cursor-pointer">
                        <AccountAvatar account={account}
                                       className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium truncate">{account.name}</p>
                          <div className="flex justify-between items-center text-xs text-gray-400">
                            <MoneyValue amount={account.balance} currency={account.currency} />
                            <span>{account.currency}</span>
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      align="start"
                      sideOffset={5}
                      alignOffset={-8}
                      className="p-0 bg-transparent border-none shadow-none">
                      <Card className="w-64 bg-popover text-popover-foreground">
                        <CardContent className="p-4">
                          <h3 className="font-bold mb-2">{account.name}</h3>
                          <p className="text-sm mb-1">Balance: <MoneyValue amount={account.balance}
                                                                           currency={account.currency} /></p>
                          <p className="text-sm mb-1">Last Transaction: {account.lastTransaction}</p>
                          <p className="text-sm">Account Number: {account.accountNumber}</p>
                        </CardContent>
                      </Card>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="flex-shrink-0 mt-auto p-4 border-t border-accent space-y-2">
          <div className={cn('flex flex-col items-start space-y-1 overflow-hidden transition-all duration-300 ease-in-out', {
            'max-h-20 opacity-100': isSidebarExpanded,
            'max-h-0 opacity-0': !isSidebarExpanded,
          })}>
            <div className="w-full flex justify-between items-center">
              <span className="text-xs font-semibold text-accent-foreground/60">Total Balance</span>
              <MoneyValue className="font-bold text-sm" amount={totalBalance} currency={user.baseCurrency} />
            </div>
            <div className="w-full flex justify-between items-center">
              <span className="text-xs font-semibold text-accent-foreground/60">Total Debt</span>
              <MoneyValue
                className="font-bold text-sm text-destructive"
                amount={totalDebt}
                currency={user.baseCurrency} />
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={() => openForm('account')}>
            <Plus className="h-4 w-4" />
            {isSidebarExpanded && <span className="ml-2">Add Account</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};
