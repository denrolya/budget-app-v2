import { Download, Edit } from 'lucide-react';
import React, { useMemo } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AccountDetails from '@/components/features/accounts/Details';
import SidebarListing from '@/components/features/accounts/SidebarListing';
import WalletBar from '@/components/features/accounts/WalletBar';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { useFinanceData } from '@/contexts/FinanceData';
import Account from '@/models/Account';
import { accountService } from '@/services/api/account';

const AccountsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { accountId } = useParams<{ accountId: string }>();

  // You can keep this page dumb: sidebar + nested routes for content.
  return (
    <PageWithSidebar contentScrollable>
      <PageWithSidebar.Sidebar ariaLabel="Accounts sidebar">
        <SidebarListing
          selectedId={accountId ?? null}
          onSelect={(acc: Account) => navigate(`/accounts/${acc.id}`)}
          onClear={() => navigate('/accounts')}
        />
      </PageWithSidebar.Sidebar>

      <PageWithSidebar.Content className="min-h-0 h-full">
        <Routes>
          <Route index element={<AccountsIndex />} />
          <Route path=":accountId" element={<AccountDetailsRoute />} />
          <Route path="*" element={<Navigate to="/accounts" replace />} />
        </Routes>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

const AccountsIndex: React.FC = () => (
  <div className="flex h-full w-full items-center justify-center bg-muted p-4">
    <WalletBar className="w-full max-w-6xl" />
  </div>
);

const AccountDetailsRoute: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { data, updateAccount } = useFinanceData();

  const account = useMemo(() => {
    if (!accountId) return null;
    return data?.accounts?.find((a) => String(a.id) === accountId) ?? null;
  }, [data?.accounts, accountId]);

  const onAccountUpdate = async (account: Account, diff: Partial<Account>) => {
    await accountService.update(account.id, diff);
    updateAccount(account);
    toast.success('Account is now displayed on sidebar by default');
  };

  if (!accountId) return <Navigate to="/accounts" replace />;

  if (!data) return null; // Or a loader, depending on how your provider works
  if (!account) return <Navigate to="/accounts" replace />; // Or a NotFound view

  return (
    <>
      <PageWithSidebar.Header title="Account Details" onBack={() => navigate('/accounts')}>
        <Button variant="outline" size="icon" aria-label="Export">
          <Download className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Edit">
          <Edit className="h-4 w-4" aria-hidden="true" />
        </Button>
      </PageWithSidebar.Header>

      <div className="p-4">
        <AccountDetails account={account} onAccountUpdate={onAccountUpdate} />
      </div>
    </>
  );
};

export default AccountsManagementPage;
