import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { ChevronRightIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { memo, useEffect, useId, useMemo, useState } from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import AccountPill from '@/components/features/accounts/Pill';
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

  const switchId = useId();
  const pinnedHintId = useId();

  useEffect(() => {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved !== null) setShowPinnedOnly(saved === '1');
  }, []);

  useEffect(() => {
    storage.setItem(STORAGE_KEY, showPinnedOnly ? '1' : '0');
  }, [showPinnedOnly]);

  const filtered = useMemo(
    () => (showPinnedOnly ? accounts.filter((a) => a.isDisplayedOnSidebar) : accounts),
    [accounts, showPinnedOnly],
  );

  const hiddenCount = useMemo(() => accounts.filter((a) => !a.isDisplayedOnSidebar).length, [accounts]);

  const byTypeAll = useMemo(
    () => groupBy(accounts, 'type') as Partial<Record<AccountType, Account[]>>,
    [accounts],
  );

  const byTypeVisible = useMemo(
    () => groupBy(filtered, 'type') as Partial<Record<AccountType, Account[]>>,
    [filtered],
  );

  const AccountRow = memo(({ a }: { a: Account }) => {
    const nativeAmount = a.balance;
    const baseAmount = a.convertedValues?.[baseCurrency];

    const isNegative = nativeAmount < 0;
    const isEmpty = a.isEmpty();

    const showBaseLine = baseAmount != null && a.currency !== baseCurrency;

    const primaryAmountClass = cn(
      'text-xs tabular-nums font-semibold leading-none',
      isNegative && 'text-destructive',
      isEmpty && 'text-muted-foreground',
    );

    const secondaryAmountClass = cn('text-2xs tabular-nums leading-none text-muted-foreground');

    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild>
          {/* Overflow control: min-w-0 on flex parent, overflow-hidden on label + amounts */}
          <div
            role="button"
            tabIndex={0}
            className={cn(
              'flex h-9 w-full items-center gap-2 pr-2',
              'min-w-0 overflow-hidden', // critical: prevent child overflow -> horizontal scrollbar
            )}
            aria-label={`Account ${a.displayName}`}
          >

            {/* Name block */}
            <div className="min-w-0 flex-1 overflow-hidden">
              <AccountPill showName size="sm" variant="inline" account={a} />
            </div>

            {/* Amount block - must be able to shrink */}
            <div className="flex min-w-0 flex-col items-end gap-0.5 overflow-hidden">
              {/* Primary: native currency */}
              <span className={cn(primaryAmountClass, 'max-w-full truncate')} title={`${nativeAmount} ${a.currency}`}>
                <MoneyValue
                  amount={nativeAmount}
                  currency={a.currency}
                  showValuesTooltip={false}
                  showSign={false}
                />
              </span>

              {/* Secondary: base currency */}
              {showBaseLine && (
                <span
                  className={cn(secondaryAmountClass, 'max-w-full truncate')}
                  title={`${baseAmount} ${baseCurrency}`}
                >
                  <MoneyValue
                    amount={baseAmount}
                    currency={baseCurrency}
                    showValuesTooltip={false}
                    showSign={false}
                    prefix="≈ "
                  />
                </span>
              )}
            </div>
          </div>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  });
  AccountRow.displayName = 'AccountRow';

  const Group = memo(
    ({
       type,
       items,
       totalInBase,
     }: {
      type: AccountType;
      items: Account[];
      totalInBase: number;
    }) => {
      const contentId = `accounts-group-content-${type}`;
      const triggerId = `accounts-group-trigger-${type}`;

      return (
        <Collapsible asChild defaultOpen className="group/collapsible">
          <SidebarMenuItem id={`account-group-${type}`}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                id={triggerId}
                className="capitalize data-[state=open]:bg-accent"
                aria-controls={contentId}
                aria-label={`Toggle ${type} accounts`}
              >
                <span className="truncate text-xs font-medium text-muted-foreground">{type}</span>

                {/* Prevent total from forcing overflow */}
                <span className="ml-auto flex min-w-0 items-center gap-2">
                  <span className="min-w-0 max-w-[8rem] truncate text-xs font-semibold tabular-nums">
                    <MoneyValue amount={totalInBase} showSign={false} />
                  </span>
                  <ChevronRightIcon
                    className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90"
                    aria-hidden="true"
                  />
                </span>
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent id={contentId} role="region" aria-labelledby={triggerId}>
              <SidebarMenuSub className="m-0 !border-l-0 px-1 py-0 overflow-hidden">
                {items.map((a) => (
                  <AccountRow key={a.id} a={a} />
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    },
  );
  Group.displayName = 'Group';

  return (
    <SidebarGroup
      className={cn(
        'group-data-[collapsible=icon]:hidden mt-auto',
        'overflow-x-hidden', // last line of defense against accidental horizontal scroll
      )}
      aria-label="Accounts sidebar"
    >
      {/* pinned toggle bar */}
      <SidebarMenu className="mb-1 overflow-x-hidden">
        <SidebarMenuItem className="flex items-center justify-between px-2 py-1">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowPinnedOnly((v) => !v)}
                  aria-label="Toggle pinned accounts filter"
                  aria-describedby={pinnedHintId}
                >
                  {showPinnedOnly ? (
                    <EyeIcon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="text-sm">{showPinnedOnly ? 'Pinned only' : 'All accounts'}</span>
                </button>
              </TooltipTrigger>

              <TooltipContent id={pinnedHintId} side="right" className="text-xs">
                Show only pinned accounts (isDisplayedOnSidebar).
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1">
            {hiddenCount > 0 && (
              <span
                className="rounded bg-muted px-1 text-2xs leading-4 text-muted-foreground"
                aria-label={`${hiddenCount} hidden accounts`}
              >
                {hiddenCount}
              </span>
            )}

            <Switch
              id={switchId}
              className="scale-90"
              checked={showPinnedOnly}
              onCheckedChange={setShowPinnedOnly}
              aria-label="Pinned only"
            />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarMenu className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden')} aria-label="Accounts list">
        {ACCOUNT_TYPES_ORDER.map((type) => {
          const items = byTypeVisible[type];
          if (!items?.length) return null;

          const totalInBase = sumBy(byTypeAll[type] ?? [], (acc) => acc.convertedValues?.[baseCurrency] ?? acc.balance);

          return <Group key={type} type={type} items={items} totalInBase={totalInBase} />;
        })}
      </SidebarMenu>

      <SidebarMenu className="mt-1 overflow-x-hidden" aria-label="Accounts totals">
        <SidebarMenuItem className="-mx-2 px-2">
          <div className="-mx-2 mb-1 h-px bg-border" role="separator" aria-orientation="horizontal" />

          <SidebarMenuButton
            asChild
            className="h-8 cursor-default select-none hover:bg-transparent focus-visible:ring-0"
            aria-label="Total balance"
          >
            <div className="flex w-full items-center justify-between min-w-0">
              <span className="uppercase tracking-wide text-muted-foreground text-xs">Total</span>
              <span className="min-w-0 max-w-[10rem] truncate text-sm font-semibold tabular-nums">
                <MoneyValue amount={total} currency={baseCurrency} showSign={false} />
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default NavAccounts;
