import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { ChevronRightIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import AccountAvatar from '@/components/features/accounts/Avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBaseCurrency } from '@/contexts/auth';
import { useActiveAccountsWithDefaultOrder, useTotalBalance } from '@/contexts/FinanceData';
import { cn } from '@/lib/utils';
import Account, { ACCOUNT_TYPES_ORDER } from '@/models/Account';
import storage from '@/services/storage';
import { Type as AccountType } from '@/types/account';

const STORAGE_KEY = 'sidebar.showPinnedOnly';

const NavAccounts = () => {
  const baseCurrency = useBaseCurrency() as string;
  const accounts = useActiveAccountsWithDefaultOrder() as Account[];
  const total = useTotalBalance() as number;

  const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(true);

  useEffect(() => {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved !== null) setShowPinnedOnly(saved === '1');
  }, []);
  useEffect(() => {
    storage.setItem(STORAGE_KEY, showPinnedOnly ? '1' : '0');
  }, [showPinnedOnly]);

  const filtered = useMemo(
    () => (showPinnedOnly ? accounts.filter((a) => a.isDisplayedOnSidebar) : accounts),
    [accounts, showPinnedOnly]
  );

  const hiddenCount = useMemo(
    () => accounts.filter((a) => !a.isDisplayedOnSidebar).length,
    [accounts]
  );

  const byTypeAll = useMemo(
    () => groupBy(accounts, 'type') as Partial<Record<AccountType, Account[]>>,
    [accounts]
  );
  const byTypeVisible = useMemo(
    () => groupBy(filtered, 'type') as Partial<Record<AccountType, Account[]>>,
    [filtered]
  );

  const AccountRow = memo(({ a }: { a: Account }) => {
    const amount = a.convertedValues?.[baseCurrency] ?? a.balance;
    const rowAmountClass = cn(
      'text-[11px] tabular-nums font-medium',
      a.balance < 0 && 'text-destructive',
      a.isEmpty() && 'text-muted-foreground'
    );

    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild>
          <div className="flex h-8 w-full items-center gap-2 pr-2">
            <AccountAvatar className="h-full w-full rounded-sm shrink-0" size="sm" account={a} />
            <span className="min-w-0 flex-1 truncate text-xs">{a.displayName}</span>
            <span className={rowAmountClass}>
              <MoneyValue
                amount={amount}
                showValuesTooltip={false}
                showSign={false}
                maximumFractionDigits={2}
              />
            </span>
          </div>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  });

  const Group = memo(
    ({
       type,
       items,
       totalInBase,
     }: {
      type: AccountType;
      items: Account[];
      totalInBase: number;
    }) => (
      <Collapsible asChild defaultOpen className="group/collapsible">
        <SidebarMenuItem id={`account-group-${type}`}>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="capitalize data-[state=open]:bg-accent">
              <span className="truncate">{type}</span>
              <span className="ml-auto flex items-center gap-2">
                <MoneyValue className="text-xs font-semibold tabular-nums" amount={totalInBase} />
                <ChevronRightIcon className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </span>
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub className="m-0 !border-l-0 px-1 py-0">
              {items.map((a) => (
                <AccountRow key={a.id} a={a} />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  );

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden mt-auto">
      {/* pinned toggle bar */}
      <SidebarMenu className="mb-1">
        <SidebarMenuItem className="flex items-center justify-between px-2 py-1 text-sm">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowPinnedOnly((v) => !v)}
                  aria-label="Toggle pinned accounts"
                >
                  {showPinnedOnly ? <EyeIcon className="h-3.5 w-3.5" /> : <EyeOffIcon className="h-3.5 w-3.5" />}
                  <span>{showPinnedOnly ? 'Pinned only' : 'All accounts'}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Show only pinned accounts (isDisplayedOnSidebar).
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1">
            {hiddenCount > 0 && (
              <span className="rounded bg-muted px-1 text-[10px] leading-4 text-muted-foreground">{hiddenCount}</span>
            )}
            <Switch className="scale-90" checked={showPinnedOnly} onCheckedChange={setShowPinnedOnly} />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarMenu className="max-h-[300px] overflow-y-auto">
        {ACCOUNT_TYPES_ORDER.map((type) => {
          const items = byTypeVisible[type];
          if (!items?.length) return null;

          const totalInBase = sumBy(byTypeAll[type] ?? [], (acc) => acc.convertedValues?.[baseCurrency] ?? acc.balance);

          return <Group key={type} type={type} items={items} totalInBase={totalInBase} />;
        })}
      </SidebarMenu>

      <SidebarMenu className="mt-1">
        <SidebarMenuItem className="-mx-2 px-2">
          <div className="-mx-2 mb-1 h-px bg-border" />
          <SidebarMenuButton
            asChild
            className="h-8 cursor-default select-none hover:bg-transparent focus-visible:ring-0 text-xs"
          >
            <div className="flex w-full items-center justify-between">
              <span className="uppercase tracking-wide text-muted-foreground">Total</span>
              <MoneyValue className="text-sm font-semibold tabular-nums" amount={total} />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default NavAccounts;
