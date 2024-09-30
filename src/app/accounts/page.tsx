import cn from 'classnames';
import { Archive, Calendar, Search } from 'lucide-react';
import React, { useEffect, useState, useCallback, useRef } from 'react';

import Account, { AccountType } from '@/models/Account.ts';
import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay.tsx';
import AccountAvatar from '@/components/features/accounts/Avatar';
import AccountDetails from '@/components/features/accounts/Details';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAccountsWithDefaultOrder } from '@/contexts/FinanceData';

export const AccountsManagementPage: React.FC = () => {
  const accounts = useAccountsWithDefaultOrder();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const selectedAccountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAccountSelect = useCallback((account: Account) => {
    setSelectedAccount(account);
    setTimeout(() => {
      selectedAccountRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, 0);
  }, []);

  const filteredAccounts = accounts.filter(account =>
    (showArchived || !account.isArchived()) &&
    account.nameWithCurrency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedAccounts = Object.values(AccountType).reduce((acc, type) => {
    acc[type] = filteredAccounts.filter(account => account.type === type);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  const AccountList: React.FC = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Accounts</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {Object.values(AccountType).map((type) => (
          groupedAccounts[type].length > 0 && (
            <div key={type} className="mb-4">
              <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground capitalize">{type}</h3>
              {groupedAccounts[type].map((account) => (
                <div
                  key={account.id}
                  ref={selectedAccount?.id === account.id ? selectedAccountRef : null}
                  className={cn('p-4 border-b cursor-pointer hover:bg-accent hover:text-accent-foreground', {
                    'bg-accent text-accent-foreground': selectedAccount?.id === account.id,
                  })}
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <AccountAvatar account={account} size="sm" />
                      <h3 className="font-medium">{account.nameWithCurrency}</h3>
                    </div>
                    <Badge variant={account.balance > 0 ? 'success' : 'destructive'} className="text-xs">
                      <MoneyValue
                        useColors={false}
                        amount={account.balance}
                        currency={account.currency}
                        values={account.convertedValues} />
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    {account.archivedAt && (
                      <span className="flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        Archived
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Last updated: <RelativeDatetimeDisplay date={account.updatedAt} />
                  </div>
                </div>
              ))}
            </div>
          )
        ))}
        <div className="p-4">
          <button
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-screen md:h-[calc(100vh-2rem)] overflow-hidden pb-16 md:pb-0">
      {!isMobile && (
        <div className="w-80 border-r bg-background">
          <AccountList />
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {isMobile ? (
          selectedAccount ? <AccountDetails account={selectedAccount} setSelectedAccount={setSelectedAccount} /> :
            <AccountList />
        ) : (
          selectedAccount ? <AccountDetails account={selectedAccount} setSelectedAccount={setSelectedAccount} /> :
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select an account to view details
            </div>
        )}
      </div>
    </div>
  );
};

export default AccountsManagementPage;
