import sumBy from 'lodash/sumBy';
import { Archive, ArchiveRestore, Focus, Search, X } from 'lucide-react';
import React, { useCallback, useId, useMemo, useRef, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Account, Type as AccountType } from '@/features/accounts';
import AccountPill from '@/features/accounts/components/Pill';
import { useBaseCurrency } from '@/features/auth';
import { useAccountsWithDefaultOrder, useActiveAccountsWithDefaultOrder } from '@/hooks/financeData';
import { cn } from '@/lib/utils';

interface SidebarListingProps {
  selectedId: string | null;
  onSelect: (account: Account) => void;
  onClear?: () => void;
}

const SidebarListing: React.FC<SidebarListingProps> = ({ selectedId, onSelect, onClear }) => {
  const baseCurrency = useBaseCurrency();
  const activeAccounts = useActiveAccountsWithDefaultOrder();
  const accounts = useAccountsWithDefaultOrder();

  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const searchId = useId();
  const selectedAccountRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (account: Account) => {
      const isAlreadySelected = selectedId === String(account.id);

      if (isAlreadySelected && onClear) {
        onClear();
        return;
      }

      onSelect(account);

      // Smooth scroll to selected (after route changes render)
      setTimeout(() => {
        selectedAccountRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 0);
    },
    [onClear, onSelect, selectedId],
  );

  const filteredAccounts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return accounts.filter((account) => {
      if (!showArchived && account.isArchived()) return false;
      if (!query) return true;
      return account.displayName.toLowerCase().includes(query);
    });
  }, [accounts, searchTerm, showArchived]);

  const totalBalance = useMemo(
    () => sumBy(activeAccounts, ({ convertedValues }) => convertedValues?.[baseCurrency] || 0),
    [activeAccounts, baseCurrency],
  );

  const groupedAccounts = useMemo(() => Object.values(AccountType).reduce((acc, type) => {
    acc[type] = filteredAccounts.filter((account) => account.type === type);
    return acc;
  }, {} as Record<AccountType, Account[]>), [filteredAccounts]);

  return (
    <div
      aria-label="Accounts list"
      className="flex h-full flex-col overflow-x-hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onClear) onClear();
      }}
    >
      {/* Search + compact toolbar (same layout as categories) */}
      <div className="border-b p-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search accounts"
              id={searchId}
              inputMode="search"
              placeholder="Search…"
              value={searchTerm}
              className="h-9 pl-8"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div aria-label="Account actions" role="toolbar" className="flex items-center gap-1">
            {onClear && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Clear selection"
                    disabled={!selectedId}
                    size="icon"
                    type="button"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => onClear()}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear selection</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={showArchived ? 'Hide archived accounts' : 'Show archived accounts'}
                  aria-pressed={showArchived}
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="h-9 w-9"
                  onClick={() => setShowArchived((v) => !v)}
                >
                  {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showArchived ? 'Hide archived accounts' : 'Show archived accounts'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Focus selected account"
                  disabled={!selectedId}
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="h-9 w-9"
                  onClick={() => selectedAccountRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
                >
                  <Focus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Focus selected account</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Compact total line (no extra headers) */}
        <div className="mt-2 flex items-baseline justify-between gap-2 px-1">
          <div className="text-2xs font-medium text-muted-foreground">Total</div>
          <div className="text-xs font-semibold tabular-nums text-foreground text-right">
            <MoneyValue amount={totalBalance} currency={baseCurrency} showSign={false} />
          </div>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 overflow-x-hidden">
        <div role="list" className="overflow-x-hidden">
          {Object.values(AccountType).map((type) => {
            const items = groupedAccounts[type];
            if (!items?.length) return null;

            const groupTotal = sumBy(items, ({ convertedValues }) => convertedValues?.[baseCurrency] || 0);
            const regionId = `accounts-group-${type}`;

            return (
              <section aria-labelledby={regionId} key={type}>
                {/* Group header (keep, but compact) */}
                <div
                  id={regionId}
                  className={cn(
                    'px-3 py-1.5 border-b',
                    'flex items-center justify-between gap-2',
                    'text-2xs uppercase tracking-wide text-muted-foreground',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{type}</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground text-right">
                    <MoneyValue amount={groupTotal} currency={baseCurrency} showSign={false} />
                  </span>
                </div>

                <div aria-label={`${type} accounts`} role="group">
                  {items.map((account) => {
                    const accountIdStr = String(account.id);
                    const isSelected = selectedId === accountIdStr;
                    const isArchived = account.isArchived();

                    const nativeAmount = account.balance;
                    const baseAmount = account.convertedValues?.[baseCurrency] ?? 0;
                    const showBaseLine = account.currency !== baseCurrency;

                    return (
                      <div
                        aria-selected={isSelected}
                        role="listitem"
                        tabIndex={0}
                        className={cn(
                          'px-3 py-2 border-b cursor-pointer',
                          'transition-colors hover:bg-accent hover:text-accent-foreground',
                          'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          {
                            'bg-accent text-accent-foreground': isSelected,
                            'opacity-70': isArchived && !isSelected,
                          },
                        )}
                        key={account.id}
                        onClick={() => handleSelect(account)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelect(account);
                          }
                        }}
                        ref={isSelected ? selectedAccountRef : null}
                      >
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          {/* Left */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <AccountPill account={account} size="sm" tooltip={false} variant="inline" textClassName="text-sm" />
                              {isArchived && (
                                <span className="text-2xs text-muted-foreground shrink-0">Archived</span>
                              )}
                            </div>

                            <div className="mt-1 text-2xs text-muted-foreground truncate">
                              Updated: <RelativeDatetimeDisplay date={account.updatedAt} />
                            </div>
                          </div>

                          {/* Right */}
                          <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
                            <span
                              className={cn(
                                'text-xs font-semibold tabular-nums leading-tight',
                                nativeAmount < 0 && 'text-destructive',
                                account.isEmpty() && 'text-muted-foreground',
                              )}
                            >
                              <MoneyValue
                                amount={nativeAmount}
                                currency={account.currency}
                                showSign={false}
                                showValuesTooltip={false}
                              />
                            </span>

                            {showBaseLine && (
                              <span className="text-2xs tabular-nums leading-tight text-muted-foreground">
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {filteredAccounts.length === 0 && (
            <div className="p-2">
              <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-border text-2xs text-muted-foreground">
                No accounts found
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SidebarListing;
