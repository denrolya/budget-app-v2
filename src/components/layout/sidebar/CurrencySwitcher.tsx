'use client';

import * as React from 'react';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useAuth, useBaseCurrency } from '@/contexts/auth';
import { confirm } from '@/utils/confirmation';

type CurrencyType = {
  code: CURRENCY_CODE;
  name: string;
  symbol: string;
  type: 'fiat' | 'crypto';
  icon?: React.ComponentType<{ className?: string }>;
};

const CurrencySwitcher = () => {
  const { isMobile } = useSidebar();
  const { updateCurrency } = useAuth();
  const baseCurrency = useBaseCurrency();

  const fiatCurrencies = React.useMemo(
    () => Object.values(CURRENCIES).filter((c): c is CurrencyType => c.type === 'fiat'),
    [],
  );

  const [selected, setSelected] = React.useState<CurrencyType>(
    CURRENCIES[baseCurrency ?? Object.values(CURRENCIES)[0].code] as CurrencyType,
  );

  const handleChange = async (currency: CurrencyType) => {
    if (currency.code === selected.code) return;

    const confirmed = await confirm({
      title: 'Change Currency',
      description: `Are you sure you want to change your currency to ${currency.code}?`,
      confirmText: currency.code,
      cancelText: selected.code,
    });

    if (!confirmed) return;

    setSelected(currency);
    await updateCurrency(currency.code);
    toast.success(`Currency updated to ${currency.code}`);
  };

  const renderCurrencyIcon = (currency: CurrencyType) =>
    currency.icon ? <currency.icon className="size-4 shrink-0" /> : <span className="text-sm">{currency.symbol}</span>;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground p-2">
                {renderCurrencyIcon(selected)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{selected.code}</span>
                <span className="truncate text-xs">{selected.name}</span>
              </div>
              <CaretSortIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Currency</DropdownMenuLabel>
            {fiatCurrencies.map((currency) => (
              <DropdownMenuItem key={currency.code} onClick={() => handleChange(currency)} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  {renderCurrencyIcon(currency)}
                </div>
                {currency.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default CurrencySwitcher;
