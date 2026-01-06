import { Download, Edit } from 'lucide-react';
import React, { useMemo } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AccountDetails from '@/features/accounts/components/Details';
import SidebarListing from '@/features/accounts/components/SidebarListing';
import WalletBar from '@/features/accounts/components/WalletBar';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { useFinanceData } from '@/contexts/FinanceData';
import { useIsMobile } from '@/hooks/use-mobile';
import Account from '@/models/Account';
import { accountService } from '@/services/api/account';

const ManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const accountMatch = useMatch('/accounts/:accountId');
  const selectedAccountId = accountMatch?.params?.accountId ?? null;

  const showSidebar = !isMobile || !selectedAccountId;

  return (
    <PageWithSidebar contentScrollable>
      {showSidebar && (
        <PageWithSidebar.Sidebar ariaLabel="Accounts sidebar">
          <SidebarListing
            selectedId={selectedAccountId}
            onClear={() => navigate('/accounts')}
            onSelect={(acc: Account) => navigate(`/accounts/${acc.id}`)}
          />
        </PageWithSidebar.Sidebar>
      )}

      <PageWithSidebar.Content className="min-h-0 h-full">
        <Routes>
          <Route index element={<AccountsIndex />} />
          <Route element={<AccountDetailsRoute />} path=":accountId" />
          <Route element={<Navigate replace to="/accounts" />} path="*" />
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

  if (!accountId) return <Navigate replace to="/accounts" />;
  if (!data) return null;
  if (!account) return <Navigate replace to="/accounts" />;

  return (
    <>
      <PageWithSidebar.Header title="Account Details" onBack={() => navigate('/accounts')}>
        <Button aria-label="Export" size="icon" variant="outline">
          <Download aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button aria-label="Edit" size="icon" variant="outline">
          <Edit aria-hidden="true" className="h-4 w-4" />
        </Button>
      </PageWithSidebar.Header>

      <div className="p-4">
        <AccountDetails account={account} onAccountUpdate={onAccountUpdate} />
      </div>
    </>
  );
};

export default ManagementPage;
