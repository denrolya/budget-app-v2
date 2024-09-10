import cn from 'classnames';
import { ArrowRightLeft, BarChart2, Briefcase, CreditCard, Home, LucideIcon, PiggyBank, Plus } from 'lucide-react';
import { FC, ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/contexts/sidebar.tsx';

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  children: ReactNode;
}

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
                  {[...Array(20)].map((_, i) => (
                    <Button key={i} variant="ghost" className="w-full justify-start font-normal">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Account {i + 1}
                    </Button>
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
