import cn from 'classnames';
import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { Plus } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountLink from '@/components/layout/SidebarAccountLink';
import SidebarLink from '@/components/layout/SidebarLink';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/constants/routes';
import { useBaseCurrency } from '@/contexts/auth';
import { useActiveAccountsWithDefaultOrder, useDebts } from '@/contexts/FinanceData';
import { FormType, useForm } from '@/contexts/Form';
import { useSidebar } from '@/contexts/sidebar';
import { ACCOUNT_TYPES_ORDER, AccountType } from '@/models/Account';

type RouteKey = keyof typeof ROUTES

export const Sidebar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className }) => {
  const baseCurrency = useBaseCurrency();
  const accounts = useActiveAccountsWithDefaultOrder();
  const debts = useDebts();
  const [isMobile, setIsMobile] = useState(false);
  const { isSidebarExpanded, setIsSidebarExpanded } = useSidebar();
  const { openForm } = useForm();

  const totalBalance = useMemo(
    () => sumBy(
      accounts,
      ({ convertedValues }) => convertedValues?.[baseCurrency] || 0,
    ), [accounts, baseCurrency]);

  const totalDebt = useMemo(() => sumBy(
    debts,
    ({ convertedValues }) => convertedValues?.[baseCurrency] || 0,
  ), [baseCurrency, debts]);

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

  const groupedAccounts = groupBy(accounts, 'type');

  const renderAccountGroup = (type: AccountType) => {
    const accountsOfType = groupedAccounts[type] || [];
    const groupTotal = sumBy(accountsOfType, ({ convertedValues }) => convertedValues?.[baseCurrency] || 0);
    if (accountsOfType.length === 0) return null;

    return (
      <div key={`account-group-${type}`} className="mb-4">
        {isSidebarExpanded && (
          <div className="flex justify-between text-xs font-semibold text-accent-foreground/60 px-2 py-2 mb-1 capitalize">
            {type}: <MoneyValue amount={groupTotal} currency={baseCurrency} />
          </div>
        )}
        {accountsOfType.map((account) => (
          <AccountLink
            key={`account-sidebar-item-${account.id}`}
            account={account}
            isSidebarExpanded={isSidebarExpanded}
          />
        ))}
        <Separator />
      </div>
    );
  };

  return (
    <aside
      className={cn('bg-background border-r border-accent flex flex-col h-[calc(100vh-2rem)] transition-all duration-300 ease-in-out z-40', {
        'fixed inset-y-0 left-0 w-64': isMobile && isSidebarExpanded,
        'fixed inset-y-0 -left-64 w-64': isMobile && !isSidebarExpanded,
        'w-64': !isMobile && isSidebarExpanded,
        'w-16': !isMobile && !isSidebarExpanded,
      }, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 p-4 space-y-4">
          <div className="space-y-1">
            <SidebarLink
              to={ROUTES.DASHBOARD.path}
              icon={ROUTES.DASHBOARD.icon}
              isSidebarExpanded={isSidebarExpanded}>
              Dashboard
            </SidebarLink>
          </div>
          <Separator />
          <div className="space-y-1">
            {isSidebarExpanded && (
              <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Areas</div>
            )}
            {(Object.keys(ROUTES) as RouteKey[]).filter(key => key !== 'DASHBOARD').map((key) => (
              <SidebarLink key={key} to={ROUTES[key].path} icon={ROUTES[key].icon} isSidebarExpanded={isSidebarExpanded}>
                {ROUTES[key].label}
              </SidebarLink>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex-grow overflow-hidden flex flex-col">
          <ScrollArea className="flex-grow px-4">
            <div aria-labelledby="accounts-heading">
              {ACCOUNT_TYPES_ORDER.map(renderAccountGroup)}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 mt-auto p-4 border-t border-accent space-y-2">
          <div className={cn('flex flex-col items-start space-y-1 overflow-hidden transition-all duration-300 ease-in-out', {
            'max-h-20 opacity-100': isSidebarExpanded,
            'max-h-0 opacity-0': !isSidebarExpanded,
          })}>
            <div className="w-full flex justify-between items-center">
              <span className="text-xs font-semibold text-accent-foreground/60">Total Balance</span>
              <MoneyValue
                className="font-medium text-sm text-mono"
                amount={totalBalance}
                currency={baseCurrency} />
            </div>
            <div className="w-full flex justify-between items-center">
              <span className="text-xs font-semibold text-accent-foreground/60">Total Debt</span>
              <MoneyValue
                className="font-medium text-sm text-destructive text-mono"
                amount={totalDebt}
                currency={baseCurrency} />
            </div>
            <div className="w-full flex justify-between items-center">
              <span className="text-xs font-semibold text-accent-foreground/60">Total</span>
              <MoneyValue
                className={cn('font-medium text-sm text-destructive', 'text-mono', {
                  'text-destructive': totalDebt + totalBalance < 0,
                  'text-success': totalDebt + totalBalance > 0,
                  'text-accent-foreground': totalDebt + totalBalance === 0,
                })}
                amount={totalDebt + totalBalance}
                currency={baseCurrency} />
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={() => openForm(FormType.Account)}>
            <Plus className="h-4 w-4" />
            {isSidebarExpanded && <span className="ml-2">Add Account</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

Sidebar.displayName = 'Sidebar';

export default Sidebar;
