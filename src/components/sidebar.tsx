import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/contexts/sidebar';
import cn from 'classnames';
import { ArrowRightLeft, BarChart2, Briefcase, CreditCard, Home, LucideIcon, PiggyBank, Plus } from 'lucide-react';
import { FC, ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  children: ReactNode;
}

const accounts = [
  {
    id: 1,
    name: 'Binance BTC',
    icon: 'BTC',
    balance: 0,
    baseCurrency: '€ 0',
    lastTransaction: '2023-09-10',
    accountNumber: '1234567890',
  },
  {
    id: 2,
    name: 'ФОП Личный EUR',
    icon: 'EUR',
    balance: 0,
    baseCurrency: '€ 0',
    lastTransaction: '2023-09-09',
    accountNumber: '0987654321',
  },
  {
    id: 3,
    name: 'Cash EUR',
    icon: 'EUR',
    balance: 1659,
    baseCurrency: '€ 1,659',
    lastTransaction: '2023-09-08',
    accountNumber: '1122334455',
  },
  {
    id: 4,
    name: 'Revolut EUR',
    icon: 'EUR',
    balance: 19.25,
    baseCurrency: '€ 19.25',
    lastTransaction: '2023-09-07',
    accountNumber: '5544332211',
  },
  {
    id: 5,
    name: 'Wise EUR',
    icon: 'EUR',
    balance: 185.29,
    baseCurrency: '€ 185.29',
    lastTransaction: '2023-09-06',
    accountNumber: '6677889900',
  },
  {
    id: 6,
    name: 'Zen EUR',
    icon: 'EUR',
    balance: 3.64,
    baseCurrency: '€ 3.64',
    lastTransaction: '2023-09-05',
    accountNumber: '0011223344',
  },
];

export const Sidebar: FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { isSidebarExpanded, setIsSidebarExpanded, toggleSidebar } = useSidebar();

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

  const NavLink: FC<NavLinkProps> = ({ to, icon: Icon, children }) => {
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
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarExpanded && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30" onClick={toggleSidebar} />
      )}

      {/* Left Sidebar */}
      <aside
        className={cn('bg-background border-r border-accent flex flex-col transition-all duration-300 ease-in-out z-40',
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
          <div className="flex flex-col h-full">
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <NavLink to="/dashboard" icon={Home}>
                  Overview
                </NavLink>
                <NavLink to="/transactions" icon={CreditCard}>
                  Accounts
                </NavLink>
                <NavLink to="/investments" icon={BarChart2}>
                  Investments
                </NavLink>
              </div>
              <Separator />
              <div className="space-y-1">
                {isSidebarExpanded && (
                  <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Tools</div>
                )}
                <Button variant="ghost" className="w-full justify-start">
                  <PiggyBank className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Budgets</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <ArrowRightLeft className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Transfers</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Briefcase className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Financial Planning</span>}
                </Button>
              </div>
            </div>
          </div>
          <Separator />
          {isSidebarExpanded && (
            <div className="flex flex-col flex-grow overflow-hidden">
              <div className="text-xs font-semibold text-accent-foreground/60 px-6 py-2">Recent Accounts</div>
              <ScrollArea className="flex-grow px-4">
                <div className="space-y-1">
                  {accounts.map((account) => (
                    <Tooltip key={account.id}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground space-x-3 p-2 cursor-pointer">
                          <div className="flex-shrink-0">
                            <img
                              src={`/placeholder.svg?height=24&width=24&text=${account.icon}`}
                              alt={`${account.name} icon`}
                              className="w-6 h-6 rounded-full bg-gray-700"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium truncate">{account.name}</p>
                            <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>
                            {account.balance.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 2,
                            })}
                          </span>
                              <span>{account.baseCurrency}</span>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="start" sideOffset={5} alignOffset={-8} className="p-0 bg-transparent border-none shadow-none">
                        <Card className="w-64 bg-popover text-popover-foreground">
                          <CardContent className="p-4">
                            <h3 className="font-bold mb-2">{account.name}</h3>
                            <p className="text-sm mb-1">Balance: {account.baseCurrency}</p>
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

          <div className="p-4 border-t border-accent">
            <Button variant="ghost" className="w-full justify-start">
              <Plus className="h-4 w-4" />
              {isSidebarExpanded && <span className="ml-2">Add Account</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
