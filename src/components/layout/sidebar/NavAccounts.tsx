import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { ChevronRightIcon, PiggyBank } from 'lucide-react';

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
import { useBaseCurrency } from '@/contexts/auth';
import { useActiveAccountsWithDefaultOrder } from '@/contexts/FinanceData';
import { cn } from '@/lib/utils';
import { ACCOUNT_TYPES_ORDER } from '@/models/Account';
import { Type as AccountType } from '@/types/account';

const NavAccounts = () => {
  const baseCurrency = useBaseCurrency();
  const accounts = useActiveAccountsWithDefaultOrder();
  const groupedAccounts = groupBy(accounts, 'type');
  const renderAccountGroup = (type: AccountType) => {
    const accountsOfType = groupedAccounts[type] || [];
    const groupTotal = sumBy(accountsOfType, ({ convertedValues }) => convertedValues?.[baseCurrency] || 0);
    if (accountsOfType.length === 0) return null;

    return (
      <Collapsible
        asChild
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
              <PiggyBank />
              <span className="flex-1 text-left">
                {type}:{' '}
                <MoneyValue className="ml-0.5 font-bold" amount={groupTotal} currency={baseCurrency} />
              </span>
              <ChevronRightIcon className="ml-auto transition-transform duration-800 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="!border-l-0 p-0 px-1 m-0">
              {accountsOfType.map((account) => (
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
                            'text-muted-foreground': account.balance === 0,
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
      <SidebarMenu className="max-h-[300px] overflow-y-auto">{ACCOUNT_TYPES_ORDER.map(renderAccountGroup)}</SidebarMenu>
    </SidebarGroup>
  );
};

export default NavAccounts;
