import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { ChevronRightIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
import { ACCOUNT_TYPES_ORDER } from '@/models/Account';
import storage from '@/services/storage';
import { Type as AccountType } from '@/types/account';

const STORAGE_KEY = 'sidebar.showPinnedOnly';

const NavAccounts = () => {
  const baseCurrency = useBaseCurrency();
  const accounts = useActiveAccountsWithDefaultOrder();
  const total = useTotalBalance();

  const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(true);
  useEffect(() => {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved !== null) setShowPinnedOnly(saved === '1');
  }, []);
  useEffect(() => {
    storage.setItem(STORAGE_KEY, showPinnedOnly ? '1' : '0');
  }, [showPinnedOnly]);

  const filteredAccounts = useMemo(
    () => (showPinnedOnly ? accounts.filter(a => a.isDisplayedOnSidebar) : accounts),
    [accounts, showPinnedOnly],
  );

  const hiddenCount = useMemo(
    () => accounts.filter(a => !a.isDisplayedOnSidebar).length,
    [accounts],
  );

  const groupedAll = useMemo(() => groupBy(accounts, 'type'), [accounts]); // for totals
  const groupedVisible = useMemo(() => groupBy(filteredAccounts, 'type'), [filteredAccounts]); // for rows

  const renderAccountGroup = (type: AccountType) => {
    const accountsOfTypeVisible = groupedVisible[type] || [];
    if (accountsOfTypeVisible.length === 0) return null;

    const groupTotalAll = sumBy(
      groupedAll[type] || [],
      ({ convertedValues }) => convertedValues?.[baseCurrency] || 0,
    );

    return (
      <Collapsible
        asChild
        defaultOpen
        className="group/collapsible"
        key={`account-group-${type}`}
        onOpenChange={(isOpen) => {
          if (isOpen) {
            setTimeout(() => {
              const el = document.getElementById(`account-group-${type}`);
              el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 10);
          }
        }}
      >
        <SidebarMenuItem id={`account-group-${type}`}>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={type} className="capitalize hover:bg-accent data-[state=open]:bg-accent">
              {type}:{' '}
              <MoneyValue className="ml-0.5 font-bold" amount={groupTotalAll} currency={baseCurrency} />
              <ChevronRightIcon className="ml-auto transition-transform duration-800 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="!border-l-0 p-0 px-1 m-0">
              {accountsOfTypeVisible.map((account) => (
                <SidebarMenuSubItem
                  key={`account-sidebar-item-${account.id}`}
                  className="group-account-row relative border-l-none">
                  <SidebarMenuSubButton asChild className="h-8">
                    <div className="flex items-center pr-8">
                      <AccountAvatar className="w-full h-full" size="sm" account={account} />
                      <div className="flex-grow min-w-0 ml-3 overflow-hidden">
                        <p className="truncate">{account.displayName}</p>
                        <MoneyValue
                          revert
                          showValuesTooltip={false}
                          showSign={false}
                          maximumFractionDigits={2}
                          className={cn('items-center text-xs font-semibold', {
                            'text-destructive': account.balance < 0,
                            'text-success': account.balance > 0,
                            'text-muted-foreground': account.isEmpty(),
                          })}
                          amount={account.balance}
                          currency={account.currency}
                          values={account.convertedValues}
                        />
                      </div>
                    </div>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden mt-auto">
      <SidebarMenu className="mb-1">
        <SidebarMenuItem className="flex items-center justify-between px-2 py-1 text-[11px]">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowPinnedOnly((prev) => !prev)}
                >
                  {showPinnedOnly ? (
                    <EyeIcon className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOffIcon className="h-3.5 w-3.5" />
                  )}
                  <span className="truncate">{showPinnedOnly ? 'Pinned only' : 'All accounts'}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Toggle to show only pinned accounts (isDisplayedOnSidebar).
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1">
            {hiddenCount > 0 && (
              <span className="rounded bg-muted px-1 text-[10px] leading-4 text-muted-foreground">
                {hiddenCount}
              </span>
            )}
            <Switch
              className="scale-90"
              checked={showPinnedOnly}
              onCheckedChange={setShowPinnedOnly}
              aria-label="Show pinned accounts only"
            />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarMenu className="mt-1">
        <SidebarMenuItem className="-mx-2 px-2">
          <div className="-mx-2 mb-1 h-px bg-border" />
          <SidebarMenuButton
            asChild
            className="h-8 cursor-default select-none hover:bg-transparent focus-visible:ring-0 text-xs">
            <div className="flex w-full items-center justify-between">
              <span className="uppercase tracking-wide text-muted-foreground">Total</span>
              <MoneyValue className="text-sm font-semibold tabular-nums" amount={total} />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarMenu className="max-h-[300px] overflow-y-auto">
        {ACCOUNT_TYPES_ORDER.map(renderAccountGroup)}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default NavAccounts;
