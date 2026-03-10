import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { transactionService } from '@/features/transactions/api/service';
import Account from '@/features/accounts/models/Account';
import { Type as AccountType } from '@/features/accounts/types';

interface Props {
  account: Account;
}

/** Shared badge showing the number of pending draft transactions for a bank account. */
const AccountDraftBadge: React.FC<Props> = ({ account }) => {
  const enabled = account.type === AccountType.Bank;

  const { data } = useQuery({
    queryKey: ['account-drafts', account.id],
    queryFn: () =>
      transactionService.fetchList({
        page: 1,
        perPage: 1,
        filters: { accounts: [account.id], isDraft: true } as any,
        sort: {} as any,
        omitTransferTransactions: false,
      }),
    enabled,
    staleTime: 1000 * 30,
  });

  const count = data?.totalItems ?? 0;
  if (!enabled || count === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={`${count} pending draft transaction${count !== 1 ? 's' : ''}`}
          className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-1.5 py-0 text-[10px] font-semibold leading-4 text-amber-600 dark:text-amber-400 select-none"
        >
          <FileText aria-hidden="true" className="h-2.5 w-2.5 shrink-0" />
          {count > 99 ? '99+' : count}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {count} pending draft transaction{count !== 1 ? 's' : ''}
      </TooltipContent>
    </Tooltip>
  );
};

export default AccountDraftBadge;
