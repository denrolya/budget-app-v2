import cn from 'classnames';
import sumBy from 'lodash/sumBy';
import { Archive, Search } from 'lucide-react';
import React, { useCallback, useId, useMemo, useRef, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import AccountPill from '@/features/accounts/components/Pill';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBaseCurrency } from '@/contexts/auth';
import { useAccountsWithDefaultOrder } from '@/contexts/FinanceData';
import Account from '@/models/Account';
import { Type as AccountType } from '@/types/account';

interface SidebarListingProps {
  selectedId: string | null;
  onSelect: (account: Account) => void;
  onClear?: () => void;
}

const SidebarListing: React.FC<SidebarListingProps> = ({ selectedId, onSelect, onClear }) => {
  const baseCurrency = useBaseCurrency();
  const accounts = useAccountsWithDefaultOrder();

  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const selectedAccountRef = useRef<HTMLDivElement>(null);
  const searchId = useId();

  const handleAccountSelect = useCallback(
    (account: Account) => {
      const isAlreadySelected = selectedId === String(account.id);

      // Clicking the selected item toggles back to /accounts (index state) if consumer supports it.
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
    const q = searchTerm.trim().toLowerCase();

    return accounts.filter((account) => {
      if (!showArchived && account.isArchived()) return false;
      if (!q) return true;
      return account.displayName.toLowerCase().includes(q);
    });
  }, [accounts, searchTerm, showArchived]);

  const groupedAccounts = useMemo(
    () =>
      Object.values(AccountType).reduce((acc, type) => {
        acc[type] = filteredAccounts.filter((account) => account.type === type);
        return acc;
      }, {} as Record<AccountType, Account[]>),
    [filteredAccounts],
  );

  return (
    <div
      className="flex h-full flex-col overflow-x-hidden"
      aria-label="Accounts list"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onClear) onClear();
      }}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Accounts</h2>

        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search accounts
          </label>
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id={searchId}
            placeholder="Search accounts"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputMode="search"
            aria-label="Search accounts"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-x-hidden">
        <div role="list" className="overflow-x-hidden">
          {Object.values(AccountType).map((type) => {
            const items = groupedAccounts[type];
            if (!items?.length) return null;

            const groupTotal = sumBy(items, ({ convertedValues }) => convertedValues?.[baseCurrency] || 0);
            const groupRegionId = `accounts-group-${type}`;

            return (
              <section key={type} aria-labelledby={groupRegionId} className="overflow-x-hidden">
                {/* Group header */}
                <div
                  id={groupRegionId}
                  className={cn(
                    'px-4 py-2 border-b',
                    'flex items-center justify-between gap-2',
                    'text-xs uppercase tracking-wide text-muted-foreground',
                    'overflow-x-hidden',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{type}</span>

                  <span className="text-sm font-semibold tabular-nums text-foreground text-right whitespace-normal break-words">
                    <MoneyValue amount={groupTotal} currency={baseCurrency} showSign={false} />
                  </span>
                </div>

                <div role="group" aria-label={`${type} accounts`} className="overflow-x-hidden">
                  {items.map((account) => {
                    const accountIdStr = String(account.id);
                    const isSelected = selectedId === accountIdStr;
                    const isArchived = account.isArchived();

                    const nativeAmount = account.balance;
                    const baseAmount = account.convertedValues?.[baseCurrency] ?? 0;
                    const showBaseLine = account.currency !== baseCurrency;

                    return (
                      <div
                        key={account.id}
                        role="listitem"
                        ref={isSelected ? selectedAccountRef : null}
                        aria-selected={isSelected}
                        tabIndex={0}
                        className={cn(
                          'px-4 py-3 border-b cursor-pointer',
                          'transition-colors hover:bg-accent',
                          'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          'overflow-x-hidden',
                          {
                            'bg-accent': isSelected,
                            'opacity-70': isArchived && !isSelected,
                          },
                        )}
                        onClick={() => handleAccountSelect(account)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleAccountSelect(account);
                          }
                        }}
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3 min-w-0 overflow-x-hidden">
                          {/* Left */}
                          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="flex items-center gap-2 min-w-0">
                                <AccountPill size="sm" variant="inline" textClassName="text-sm" account={account} />

                                {isArchived && (
                                  <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground shrink-0">
                                    <Archive className="h-3 w-3" aria-hidden="true" />
                                    Archived
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right */}
                          <div className="flex flex-col items-end gap-0.5 text-right min-w-0 overflow-x-hidden">
                            <span
                              className={cn(
                                'text-xs font-semibold tabular-nums leading-tight text-right',
                                nativeAmount < 0 && 'text-destructive',
                                account.isEmpty() && 'text-muted-foreground',
                                'whitespace-normal break-words',
                              )}
                              title={`${nativeAmount} ${account.currency}`}
                            >
                              <MoneyValue
                                amount={nativeAmount}
                                currency={account.currency}
                                showSign={false}
                                showValuesTooltip={false}
                              />
                            </span>

                            {showBaseLine && (
                              <span
                                className="text-2xs tabular-nums leading-tight text-muted-foreground text-right whitespace-normal break-words"
                                title={`${baseAmount} ${baseCurrency}`}
                              >
                                <MoneyValue
                                  amount={baseAmount}
                                  currency={baseCurrency}
                                  showSign={false}
                                  showValuesTooltip={false}
                                  prefix="≈ "
                                />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="mt-2 text-2xs text-muted-foreground">
                          <span>Last updated: </span>
                          <RelativeDatetimeDisplay date={account.updatedAt} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="p-4">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            onClick={() => setShowArchived((v) => !v)}
            aria-pressed={showArchived}
            aria-label={showArchived ? 'Hide archived accounts' : 'Show archived accounts'}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SidebarListing;
