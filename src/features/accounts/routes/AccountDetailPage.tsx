import { Archive, ArchiveRestore, ChevronLeft, Edit, Plus } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { confirm } from '@/lib/confirmation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm } from '@/contexts/Form';

import { useList as useAccountsQuery, useMutations } from '../api';
import BankSheet from '../components/BankSheet';
import AccountDetails from '../components/Details';
import Account from '../models/Account';
import { Type as AccountType, UpdateAccountDTO } from '../types';

// ─── Header ───────────────────────────────────────────────────────────────────

interface AccountDetailsHeaderProps {
  account: Account;
  isArchiving: boolean;
  onBack: () => void;
  onAccountUpdate: (account: Account, diff: UpdateAccountDTO) => Promise<void>;
  onAddTransaction: () => void;
  onToggleArchive: () => Promise<void>;
  onEdit: () => void;
}

const AccountDetailsHeader: React.FC<AccountDetailsHeaderProps> = ({
  account,
  isArchiving,
  onBack,
  onAccountUpdate,
  onAddTransaction,
  onToggleArchive,
  onEdit,
}) => {
  const ArchiveIcon = account.isArchived() ? ArchiveRestore : Archive;
  const archiveLabel = account.isArchived() ? 'Unarchive account' : 'Archive account';

  return (
    <div className="flex items-center gap-2 px-4 h-12 border-b bg-background shrink-0">
      <Button aria-label="Back to accounts" size="icon" variant="ghost" onClick={onBack}>
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </Button>

      <span className="flex-1 text-sm font-semibold truncate">Account Details</span>

      <div className="flex items-center gap-1">
        {account.type === AccountType.Bank && <BankSheet account={account} onAccountUpdate={onAccountUpdate} />}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Add Transaction" size="icon" variant="outline" onClick={onAddTransaction}>
              <Plus aria-hidden="true" className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add new account transaction</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={archiveLabel}
              disabled={isArchiving}
              size="icon"
              variant="outline"
              onClick={onToggleArchive}
            >
              <ArchiveIcon aria-hidden="true" className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{archiveLabel}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Edit account details" size="icon" variant="outline" onClick={onEdit}>
              <Edit aria-hidden="true" className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit account details</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

// ─── Route component ──────────────────────────────────────────────────────────

const AccountDetailPage: React.FC = () => {
  const { openForm } = useForm();
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  const { data } = useAccountsQuery();
  const { update, archive, isArchiving } = useMutations();

  const account = useMemo(
    () => (accountId ? (data?.find((a) => String(a.id) === accountId) ?? null) : null),
    [data, accountId],
  );

  const onAccountUpdate = useCallback(
    async (acc: Account, diff: UpdateAccountDTO) => {
      await update({ id: acc.id, diff });
    },
    [update],
  );

  const onToggleArchive = useCallback(async () => {
    if (!account) return;

    const action = account.isArchived() ? 'Unarchive' : 'Archive';
    const confirmed = await confirm({
      title: `${action} account?`,
      description: `Are you sure you want to ${action.toLowerCase()} the account "${account.name}"?`,
      confirmText: action,
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    await archive({ id: account.id, archivedAt: account.isArchived() ? null : new Date().toISOString() });
  }, [account, archive]);

  if (!accountId) return <Navigate replace to="/accounts" />;
  if (!data) return null;
  if (!account) return <Navigate replace to="/accounts" />;

  return (
    <div className="h-full flex flex-col min-h-0">
      <AccountDetailsHeader
        account={account}
        isArchiving={isArchiving}
        onAccountUpdate={onAccountUpdate}
        onAddTransaction={() => openForm(FormType.Transaction, { account })}
        onBack={() => navigate('/accounts')}
        onEdit={() => openForm(FormType.Account, account)}
        onToggleArchive={onToggleArchive}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="min-h-full min-w-0 flex flex-col p-4">
            <AccountDetails key={account.id} account={account} onAccountUpdate={onAccountUpdate} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AccountDetailPage;
