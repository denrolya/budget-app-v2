import cn from 'classnames';
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
import { useAuth } from '@/contexts/auth';
import { useActiveAccountsWithDefaultOrder, useDebts } from '@/contexts/FinanceData';
import { FormType, useForm } from '@/contexts/Form';
import { useSidebar } from '@/contexts/sidebar';

interface Props {
  className?: string;
}

export const Sidebar: React.FC<Props> = ({ className }) => {
  const { user } = useAuth();
  const accounts = useActiveAccountsWithDefaultOrder();
  const debts = useDebts();
  const [isMobile, setIsMobile] = useState(false);
  const { isSidebarExpanded, setIsSidebarExpanded } = useSidebar();
  const { openForm } = useForm();

  const totalBalance = useMemo(
    () => sumBy(accounts, ({ convertedValues }) => convertedValues[user.baseCurrency] || 0),
    [accounts?.length],
  );

  const totalDebt = useMemo(() => sumBy(debts, ({ convertedValues }) => convertedValues[user?.baseCurrency] || 0), [debts?.length]);

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

  return (
    <aside
      className={cn('bg-background border-r border-accent flex flex-col h-[calc(100vh-2rem)] transition-all duration-300 ease-in-out z-40',
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
            <SidebarLink to={ROUTES.DASHBOARD.path} icon={ROUTES.DASHBOARD.icon} isSidebarExpanded={isSidebarExpanded}>
              Dashboard
            </SidebarLink>
            <SidebarLink to={ROUTES.DAILY_LEDGER.path}
                         icon={ROUTES.DAILY_LEDGER.icon}
                         isSidebarExpanded={isSidebarExpanded}>
              Daily Ledger
            </SidebarLink>
          </div>
          <Separator />
          <div className="space-y-1">
            {isSidebarExpanded && (
              <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Tools</div>
            )}
            <SidebarLink to={ROUTES.TRANSACTION_LIST.path}
                         icon={ROUTES.TRANSACTION_LIST.icon}
                         isSidebarExpanded={isSidebarExpanded}>
              Transactions
            </SidebarLink>
            <SidebarLink to={ROUTES.TRANSFER_LIST.path}
                         icon={ROUTES.TRANSFER_LIST.icon}
                         isSidebarExpanded={isSidebarExpanded}>
              Transfers
            </SidebarLink>
            <SidebarLink to={ROUTES.ACCOUNT_LIST.path}
                         icon={ROUTES.ACCOUNT_LIST.icon}
                         isSidebarExpanded={isSidebarExpanded}>
              Accounts
            </SidebarLink>
            <SidebarLink to={ROUTES.DEBT_LIST.path} icon={ROUTES.DEBT_LIST.icon} isSidebarExpanded={isSidebarExpanded}>
              Debts
            </SidebarLink>
          </div>
        </div>

        <Separator />

        {isSidebarExpanded && (
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="text-xs font-semibold text-accent-foreground/60 px-6 py-2">Recent Accounts</div>
            <ScrollArea className="flex-grow px-4">
              <div className="space-y-1">
                {accounts.map((account) => (
                  <AccountLink
                    key={`account-sidebar-item-${account.id}`}
                    account={account}
                    isSidebarExpanded={isSidebarExpanded} />
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
