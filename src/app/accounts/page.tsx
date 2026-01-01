import { Download, Edit } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import AccountDetails from '@/components/features/accounts/Details';
import SidebarListing from '@/components/features/accounts/SidebarListing';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useFinanceData } from '@/contexts/FinanceData';
import Account from '@/models/Account';
import { accountService } from '@/services/api/account';

export const AccountsManagementPage: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const { icon: Icon } = ROUTES.ACCOUNT_LIST;
  const { updateAccount } = useFinanceData();

  const onAccountUpdate = async (account: Account, diff: Partial<Account>) => {
    await accountService.update(account.id, diff);
    updateAccount(account);
    setSelectedAccount(account);
    console.log({ account });
    toast.success('Account is now displayed on sidebar by default');
  };

  return (
    <PageWithSidebar contentScrollable={true}>
      <PageWithSidebar.Sidebar ariaLabel="Accounts sidebar">
        <SidebarListing selected={selectedAccount} onSelect={setSelectedAccount} />
      </PageWithSidebar.Sidebar>

      {selectedAccount && (
        <PageWithSidebar.Header title="Account Details" onBack={() => setSelectedAccount(null)}>
          <Button variant="outline" size="icon" aria-label="Export">
            <Download className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Edit">
            <Edit className="h-4 w-4" aria-hidden="true" />
          </Button>
        </PageWithSidebar.Header>
      )}

      {/* Make content area a flex container so the empty state can truly center */}
      <PageWithSidebar.Content className="min-h-0 h-full">
        {selectedAccount ? (
          <div className="p-4">
            <AccountDetails account={selectedAccount} onAccountUpdate={onAccountUpdate} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-8 w-8 text-primary/60" aria-hidden="true" />
              </div>
              <p className="text-muted-foreground max-w-xs">
                Select an account from the sidebar to view details
              </p>
            </div>
          </div>
        )}
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default AccountsManagementPage;
