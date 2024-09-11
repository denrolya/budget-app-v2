import { Check, Laptop, LogOut, Menu, Moon, Settings, Sun, User, X } from 'lucide-react';
import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import cn from 'classnames';

import { CurrencySelector } from '@/components/currency-selector';
import { HeaderExchangeRatesDetails as ExchangeRatesDetails } from '@/components/header-exchange-rates-details';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/contexts/sidebar';
import { Theme, useTheme } from '@/contexts/theme';

export const Header: React.FC = () => {
  const { isSidebarExpanded, toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();

  interface HeaderLinkProps extends LinkProps {
    className?: string;
  }

  const HeaderLink: React.FC<HeaderLinkProps> = ({ to, children, className, ...rest }) => (
      <Link
        to={to}
        className={cn('text-sm transition-colors hover:text-foreground/80 text-foreground focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-primary', className)}
        {...rest}
      >
        {children}
      </Link>
    );

  return (
    <header className="bg-accent/10 backdrop-blur-xl border-b border-accent h-10 md:h-8 flex items-center px-4 justify-between">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          {isSidebarExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <nav className="hidden md:flex space-x-4">
          <HeaderLink to="/dashboard">
            Dashboard
          </HeaderLink>
          <HeaderLink to="/transactions">
            Transactions
          </HeaderLink>
          <HeaderLink to="/ledger">
            Ledger
          </HeaderLink>
          <HeaderLink to="/debts">
            Debts
          </HeaderLink>
          <HeaderLink to="/accounts">
            Accounts
          </HeaderLink>
          <HeaderLink to="/reports">
            Reports
          </HeaderLink>
          <HeaderLink to="/categories">
            Categories
          </HeaderLink>
        </nav>
      </div>

      <Separator orientation="vertical" className="hidden md:block" />

      <div className="flex items-center space-x-2 md:space-x-4">
        <ExchangeRatesDetails />

        <CurrencySelector />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme(Theme.Light)}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                  {theme === Theme.Light && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(Theme.Dark)}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                  {theme === Theme.Dark && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(Theme.System)}>
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>System</span>
                  {theme === Theme.System && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
