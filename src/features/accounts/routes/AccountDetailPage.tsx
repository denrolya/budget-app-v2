import { Archive, ArchiveRestore, Edit, FileText, Plus } from 'lucide-react';
import React, { useCallback, useMemo, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { confirm } from '@/lib/confirmation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm } from '@/contexts/Form';

import { useList as useAccountsQuery, useMutations } from '../api';
import BankSheet from '../components/BankSheet';
import AccountDetails from '../components/Details';
import type Account from '../models/Account';
import { Type as AccountType, type UpdateAccountDTO } from '../types';

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

  const reviewDraftsRef = useRef<(() => void) | null>(null);

  if (!accountId) return <Navigate replace to="/accounts" />;
  if (!data) return null;
  if (!account) return <Navigate replace to="/accounts" />;

  const hasDrafts = account.type === AccountType.Bank && account.draftCount > 0;

  const ArchiveIcon = account.isArchived() ? ArchiveRestore : Archive;
  const archiveLabel = account.isArchived() ? 'Unarchive account' : 'Archive account';

  return (
    <div className="h-full flex flex-col min-h-0">
      <PageWithSidebar.Header
        className="px-4 py-2"
        title={account.name}
        onBack={() => navigate('/accounts')}
      >
        {hasDrafts && (
          <div className="flex items-center gap-1.5 text-2xs text-warning mr-1">
            <FileText className="h-3 w-3 shrink-0" />
            <span><span className="font-medium">{account.draftCount}</span> pending</span>
            <button className="underline underline-offset-2 hover:no-underline" type="button" onClick={() => reviewDraftsRef.current?.()}>
              Review →
            </button>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Add Transaction"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => openForm(FormType.Transaction, { account })}
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add new account transaction</TooltipContent>
        </Tooltip>

        {account.type === AccountType.Bank && <BankSheet account={account} onAccountUpdate={onAccountUpdate} />}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Edit account details"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => openForm(FormType.Account, account)}
            >
              <Edit aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit account details</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={archiveLabel}
              disabled={isArchiving}
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onToggleArchive}
            >
              <ArchiveIcon aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{archiveLabel}</TooltipContent>
        </Tooltip>
      </PageWithSidebar.Header>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AccountDetails
          account={account}
          key={account.id}
          onAccountUpdate={onAccountUpdate}
          onSetReviewDrafts={(fn) => { reviewDraftsRef.current = fn; }}
        />
      </div>
    </div>
  );
};

export default AccountDetailPage;
