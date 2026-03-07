import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { ChevronRightIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { memo, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { MoneyValue } from '@/components/common/MoneyValue';
import AccountPill from '@/features/accounts/components/Pill';
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
import { useBaseCurrency } from '@/features/auth';
import { CURRENCY_CODE } from '@/constants/currency';
import { useActiveAccountsWithDefaultOrder, useTotalBalance } from '@/hooks/financeData';
import { cn } from '@/lib/utils';
import { Account, Type as AccountType, ACCOUNT_TYPES_ORDER } from '@/features/accounts';
import storage from '@/services/storage';

const STORAGE_KEY = 'sidebar.showPinnedOnly';

const NavAccounts = () => {
  const baseCurrency = useBaseCurrency() as CURRENCY_CODE;
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
          {/* Link preserves styling and semantics; no role="button" needed */}
          <Link
            aria-label={`Account ${a.displayName}`}
            to={`/accounts/${a.id}`}
            className={cn(
              'flex h-9 w-full items-center gap-2 pr-2',
              'min-w-0 overflow-hidden',
            )}
          >
            {/* Name block */}
            <div className="min-w-0 flex-1 overflow-hidden">
              <AccountPill showName account={a} size="sm" tooltip={false} variant="inline" />
            </div>

            {/* Amount block - must be able to shrink */}
            <div className="flex min-w-0 flex-col items-end gap-0.5 overflow-hidden">
              {/* Primary: native currency */}
              <span title={`${nativeAmount} ${a.currency}`} className={cn(primaryAmountClass, 'max-w-full truncate')}>
                <MoneyValue
                  amount={nativeAmount}
                  currency={a.currency}
                  showSign={false}
                  showValuesTooltip={false}
                />
              </span>

              {/* Secondary: base currency */}
              {showBaseLine && (
                <span
                  title={`${baseAmount} ${baseCurrency}`}
                  className={cn(secondaryAmountClass, 'max-w-full truncate')}
                >
                  <MoneyValue
                    amount={baseAmount}
                    currency={baseCurrency}
                    prefix="≈ "
                    showSign={false}
                    showValuesTooltip={false}
                  />
                </span>
              )}
            </div>
          </Link>
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
                aria-controls={contentId}
                aria-label={`Toggle ${type} accounts`}
                id={triggerId}
                className="capitalize data-[state=open]:bg-accent"
              >
                <span className="truncate text-xs font-medium text-muted-foreground">{type}</span>

                <span className="ml-auto flex min-w-0 items-center gap-2">
                  <span className="min-w-0 max-w-[8rem] truncate text-xs font-semibold tabular-nums">
                    <MoneyValue amount={totalInBase} showSign={false} />
                  </span>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90"
                  />
                </span>
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent aria-labelledby={triggerId} id={contentId} role="region">
              <SidebarMenuSub className="m-0 !border-l-0 px-1 py-0 overflow-hidden">
                {items.map((a) => (
                  <AccountRow a={a} key={a.id} />
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
      aria-label="Accounts sidebar"
      className={cn('group-data-[collapsible=icon]:hidden mt-auto', 'overflow-x-hidden')}
    >
      {/* pinned toggle bar */}
      <SidebarMenu className="mb-1 overflow-x-hidden">
        <SidebarMenuItem className="flex items-center justify-between px-2 py-1">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-describedby={pinnedHintId}
                  aria-label="Toggle pinned accounts filter"
                  type="button"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowPinnedOnly((v) => !v)}
                >
                  {showPinnedOnly ? (
                    <EyeIcon aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <EyeOffIcon aria-hidden="true" className="h-4 w-4" />
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
                aria-label={`${hiddenCount} hidden accounts`}
                className="rounded bg-muted px-1 text-2xs leading-4 text-muted-foreground"
              >
                {hiddenCount}
              </span>
            )}

            <Switch
              aria-label="Pinned only"
              checked={showPinnedOnly}
              id={switchId}
              className="scale-90"
              onCheckedChange={setShowPinnedOnly}
            />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarMenu aria-label="Accounts list" className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden')}>
        {ACCOUNT_TYPES_ORDER.map((type) => {
          const items = byTypeVisible[type];
          if (!items?.length) return null;

          const totalInBase = sumBy(byTypeAll[type] ?? [], (acc) => acc.convertedValues?.[baseCurrency] ?? acc.balance);

          return <Group items={items} totalInBase={totalInBase} type={type} key={type} />;
        })}
      </SidebarMenu>

      <SidebarMenu aria-label="Accounts totals" className="mt-1 overflow-x-hidden">
        <SidebarMenuItem className="-mx-2 px-2">
          <div aria-orientation="horizontal" role="separator" className="-mx-2 mb-1 h-px bg-border" />

          <SidebarMenuButton
            asChild
            aria-label="Total balance"
            className="h-8 cursor-default select-none hover:bg-transparent focus-visible:ring-0"
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
