import { Download, Edit } from 'lucide-react';
import React, { useMemo } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate, useParams } from 'react-router-dom';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

import { useList as useAccountsQuery, useMutations } from '../api';
import AccountDetails from '../components/Details';
import SidebarListing from '../components/SidebarListing';
import WalletBar from '../components/WalletBar';
import Account from '../models/Account';

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

  const { data } = useAccountsQuery();
  const { update } = useMutations();

  const account = useMemo(() => {
    if (!accountId) return null;
    return data?.find((a) => String(a.id) === accountId) ?? null;
  }, [data, accountId]);

  const onAccountUpdate = async (account: Account, diff: Partial<Account>) => {
    await update({ account, diff });
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
