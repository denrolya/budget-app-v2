import { Bike, Check, Coins, Command, Laptop, LogOut, Moon, Sun } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useHotkeys } from '@/contexts/Hotkeys';
import { Theme, useTheme } from '@/contexts/theme';
import { useAuth, useBaseCurrency, useUser } from '@/features/auth';
import { confirm } from '@/lib/confirmation';

const NavUser: React.FC = () => {
  const { logout, updateCurrency } = useAuth();
  const user = useUser();
  const { theme, setTheme } = useTheme();
  const { openHotkeysDialog } = useHotkeys();
  const baseCurrency = useBaseCurrency();

  const fiatCurrencies = React.useMemo(() => Object.values(CURRENCIES).filter((c) => c.type === 'fiat'), []);

  const selectedCurrency = CURRENCIES[baseCurrency as CURRENCY_CODE] ?? fiatCurrencies[0];

  const handleCurrencyChange = async (code: CURRENCY_CODE) => {
    if (code === baseCurrency) return;

    const confirmed = await confirm({
      title: 'Change Currency',
      description: `Are you sure you want to change your base currency to ${code}?`,
      confirmText: code,
      cancelText: baseCurrency ?? 'Cancel',
    });

    if (!confirmed) return;

    await updateCurrency(code);
    toast.success(`Base currency updated to ${code}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="ml-4 h-8 w-8 rounded-lg cursor-pointer select-none">
          <AvatarImage alt={user.username} src={user.username} />
          <AvatarFallback className="rounded-lg">{user.username[0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="min-w-56 rounded-lg">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage alt={user.username} src={user.username} />
              <AvatarFallback className="rounded-lg">{user.username[0]}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">User:</span>
              <span className="truncate text-xs">{user.username}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={openHotkeysDialog}>
            <Command className="mr-2 h-4 w-4" />
            <span>Commands</span>
            <span className="ml-auto text-xs text-muted-foreground">⇧⇧</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Coins className="mr-2 h-4 w-4" />
            <span>Base currency</span>
            {selectedCurrency && <span className="ml-auto text-xs text-muted-foreground">{selectedCurrency.code}</span>}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Select currency</DropdownMenuLabel>
            {fiatCurrencies.map((currency) => (
              <DropdownMenuItem key={currency.code} onClick={() => handleCurrencyChange(currency.code)}>
                <span className="w-5 text-center mr-2 text-sm leading-none">{currency.symbol}</span>
                <span className="flex-1">{currency.code}</span>
                <span className="text-xs text-muted-foreground ml-2 truncate max-w-24">{currency.name}</span>
                {baseCurrency === currency.code && <Check className="ml-2 h-3.5 w-3.5 text-primary shrink-0" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Custom</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme(Theme.TronDark)}>
                <Bike className="mr-2 h-4 w-4" />
                <span>Tron Dark</span>
                {theme === Theme.TronDark && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>Default</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme(Theme.Light)}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
                {theme === Theme.Light && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(Theme.Dark)}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
                {theme === Theme.Dark && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>System</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme(Theme.System)}>
                <Laptop className="mr-2 h-4 w-4" />
                <span>System</span>
                {theme === Theme.System && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavUser;
