import cn from 'classnames';
import { Check, Laptop, LogOut, Moon, Sun, User, Command } from 'lucide-react';
import React from 'react';

import ExchangeRatesDetails from '@/components/layout/ExchangeRatesDetails';
import CurrencySelector from '@/components/layout/HeaderCurrencySelector';
import HeaderLink from '@/components/layout/HeaderLink';
import { Button } from '@/components/ui/button';
import { useHotkeys } from '@/components/common/HotkeysDialog';
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
import { useAuth } from '@/contexts/auth';
import { Theme, useTheme } from '@/contexts/theme';

interface Props {
  className?: string;
}

export const Header: React.FC<Props> = ({ className }) => {
  const { logout } = useAuth();
  const { openHotkeysDialog } = useHotkeys();
  const { theme, setTheme } = useTheme();

  return (
    <header className={cn('bg-accent/10 backdrop-blur-xl border-b border-accent h-10 md:h-8 flex items-center px-4 justify-between', className)}>
      <div className="flex items-center space-x-2">
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
            <DropdownMenuItem onClick={openHotkeysDialog}>
              <Command className="mr-2 h-4 w-4" />
              <span>Hotkeys</span>
            </DropdownMenuItem>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export default Header;
