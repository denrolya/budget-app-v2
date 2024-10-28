import { Download, Edit } from 'lucide-react';
import React, { useState } from 'react';

import AccountDetails from '@/components/features/accounts/Details';
import SidebarListing from '@/components/features/accounts/SidebarListing';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import Account from '@/models/Account';

export const AccountsManagementPage: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const { icon: Icon } = ROUTES.ACCOUNT_LIST;

  return (
    <PageWithSidebar contentScrollable={true}>
      <PageWithSidebar.Sidebar>
        <SidebarListing selected={selectedAccount} onSelect={setSelectedAccount} />
      </PageWithSidebar.Sidebar>
      {selectedAccount && (
        <PageWithSidebar.Header title="Account Details" onBack={() => setSelectedAccount(null)}>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </PageWithSidebar.Header>
      )}
      <PageWithSidebar.Content className="p-4">
        {(selectedAccount) && (
          <AccountDetails account={selectedAccount} />
        )}

        {(!selectedAccount) && (
          <div className="flex items-center justify-center h-full bg-muted -m-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Icon className="h-8 w-8 text-primary/60" />
              </div>
              <p className="text-muted-foreground max-w-[250px]">
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
