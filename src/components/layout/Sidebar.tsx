import cn from 'classnames';
import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { Plus } from 'lucide-react';
import React, { useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountLink from '@/components/layout/SidebarAccountLink';
import SidebarLink from '@/components/layout/SidebarLink';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/constants/routes';
import { useBaseCurrency } from '@/contexts/auth';
import { useActiveAccountsWithDefaultOrder, useTotalBalance } from '@/contexts/FinanceData';
import { useTotalDebt } from '@/contexts/FinanceData/hooks';
import { FormType, useForm } from '@/contexts/Form';
import { useSidebar } from '@/contexts/sidebar';
import { useScreenSize } from '@/hooks/useScreenSize';
import { ACCOUNT_TYPES_ORDER } from '@/models/Account';
import { Type as AccountType } from '@/types/account';
import { percentage } from '@/utils/percentage';

type RouteKey = keyof typeof ROUTES

export const Sidebar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className }) => {
  const totalBalance = useTotalBalance();
  const totalDebt = useTotalDebt();
  const baseCurrency = useBaseCurrency();
  const accounts = useActiveAccountsWithDefaultOrder();
  const isDesktop = useScreenSize();
  const { isSidebarExpanded, setIsSidebarExpanded } = useSidebar();
  const { openForm } = useForm();


  const debtPercentage = useMemo(() => percentage(totalDebt, totalDebt + totalBalance), [totalBalance, totalDebt]);

  const handleMouseEnter = () => {
    if (isDesktop) {
      setIsSidebarExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (isDesktop) {
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
        'fixed inset-y-0 left-0 w-64': !isDesktop && isSidebarExpanded,
        'fixed inset-y-0 -left-64 w-64': !isDesktop && !isSidebarExpanded,
        'w-64': isDesktop && isSidebarExpanded,
        'w-16': isDesktop && !isSidebarExpanded,
      }, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 p-4 space-y-4">
          <div className="space-y-1">
            {(Object.keys(ROUTES) as RouteKey[]).map((key) => (
              <SidebarLink
                key={key}
                to={ROUTES[key].path}
                icon={ROUTES[key].icon}
                isSidebarExpanded={isSidebarExpanded}>
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
          <div
            className={cn('flex flex-col items-start space-y-1 overflow-hidden transition-all duration-300 ease-in-out', {
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
              <span className="text-xs font-semibold text-accent-foreground/60">
                Total Debt
                <span className="ml-1 text-[10px] text-destructive">
                  ({debtPercentage.toFixed(0)}%)
                </span>
              </span>
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
