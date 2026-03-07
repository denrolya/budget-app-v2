import { Archive, ArchiveRestore, Edit } from 'lucide-react';
import React, { useMemo } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate, useParams } from 'react-router-dom';

import { confirm } from '@/lib/confirmation';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm } from '@/contexts/Form';
import { useIsMobile } from '@/hooks/use-mobile';

import { useList as useAccountsQuery, useMutations } from '../api';
import AccountDetails from '../components/Details';
import SidebarListing from '../components/SidebarListing';
import WalletBar from '../components/WalletBar';
import Account from '../models/Account';
import { UpdateAccountDTO } from '../types';

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
  const { openForm } = useForm();
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  const { data } = useAccountsQuery();
  const { update, archive, isArchiving } = useMutations();

  const account = useMemo(() => {
    if (!accountId) return null;
    return data?.find((a) => String(a.id) === accountId) ?? null;
  }, [data, accountId]);

  const onAccountUpdate = async (account: Account, diff: UpdateAccountDTO) => {
    await update({ id: account.id, diff });
  };

  const onToggleArchive = async () => {
    if (!account) return;

    const nextArchivedAt = account.isArchived() ? null : new Date().toISOString();
    const isConfirmed = await confirm({
      title: `${account.isArchived() ? 'Unarchive' : 'Archive'} account?`,
      description: `Are you sure you want to ${account.isArchived() ? 'unarchive' : 'archive'} the account "${account.name}"?`,
      confirmText: account.isArchived() ? 'Unarchive' : 'Archive',
      cancelText: 'Cancel',
    });

    if (!isConfirmed) return;

    await archive({ id: account.id, archivedAt: nextArchivedAt });
  };

  if (!accountId) return <Navigate replace to="/accounts" />;
  if (!data) return null;
  if (!account) return <Navigate replace to="/accounts" />;

  return (
    <>
      <PageWithSidebar.Header title="Account Details" onBack={() => navigate('/accounts')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={account.isArchived() ? 'Unarchive' : 'Archive'}
              disabled={isArchiving}
              size="icon"
              variant="outline"
              onClick={onToggleArchive}
            >
              <span className="sr-only">{account.isArchived() ? 'Unarchive account' : 'Archive account'}</span>
              {account.isArchived() ? (
                <ArchiveRestore aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Archive aria-hidden="true" className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{account.isArchived() ? 'Unarchive account' : 'Archive account'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Edit" size="icon" variant="outline" onClick={() => openForm(FormType.Account, account)}>
              <span className="sr-only">Edit account details</span>
              <Edit aria-hidden="true" className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit account details</TooltipContent>
        </Tooltip>
      </PageWithSidebar.Header>

      <div className="p-4">
        <AccountDetails account={account} onAccountUpdate={onAccountUpdate} />
      </div>
    </>
  );
};

export default ManagementPage;
