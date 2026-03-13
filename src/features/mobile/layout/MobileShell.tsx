import { ArrowLeftRight, BarChart2, DollarSign, Wallet } from 'lucide-react';
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useBaseCurrency } from '@/features/auth';
import { CURRENCIES } from '@/constants/currency';
import { FormProvider } from '@/contexts/Form';
import { useTotalBalance } from '@/hooks/financeData';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/m/balances', label: 'Balances', Icon: Wallet },
  { path: '/m/ledger', label: 'Ledger', Icon: BarChart2 },
  { path: '/m/rates', label: 'Rates', Icon: DollarSign },
  { path: '/m/convert', label: 'Convert', Icon: ArrowLeftRight },
] as const;

const MobileShell: React.FC = () => {
  const { pathname } = useLocation();
  const baseCurrency = useBaseCurrency();
  const totalBalance = useTotalBalance();

  return (
    <FormProvider>
      <TooltipProvider>
        <div className="flex flex-col h-screen bg-background overflow-hidden">
          {/* Header — tmux-style status bar */}
          <header className="h-9 shrink-0 border-b border-border flex items-center gap-2 px-3 bg-background">
            <span className="font-mono text-2xs uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
              budget
            </span>
            <span className="flex-1 font-mono text-xs tabular-nums text-foreground text-right">
              {CURRENCIES[baseCurrency].symbol}{' '}
              <MoneyValue amount={totalBalance} showSymbol={false} showValuesTooltip={false} useColors={false} />
            </span>
          </header>

          {/* Page content */}
          <main className="flex-1 min-h-0 overflow-y-auto">
            <Outlet />
          </main>

          {/* Bottom tab bar */}
          <nav aria-label="Mobile navigation" className="h-12 shrink-0 border-t border-border bg-background">
            <ul className="flex h-full">
              {NAV_ITEMS.map(({ path, label, Icon }) => {
                const isActive = pathname === path || pathname.startsWith(`${path}/`);
                return (
                  <li className="flex-1 h-full" key={path}>
                    <Link
                      aria-current={isActive ? 'page' : undefined}
                      to={path}
                      className={cn(
                        'flex flex-col items-center justify-center w-full h-full gap-0.5',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </TooltipProvider>
    </FormProvider>
  );
};

export default MobileShell;
