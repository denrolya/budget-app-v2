import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { transactionService } from '@/features/transactions/api/service';
import { TransactionFilters } from '@/features/transactions/models/TransactionFilters';
import type Account from '@/features/accounts/models/Account';
import { Type as AccountType } from '@/features/accounts/types';
import type { Sorting } from '@/types/pagination';

interface Props {
  account: Account;
}

/** Small dot indicating pending draft transactions for a bank account. Zero layout impact. */
const AccountDraftBadge: React.FC<Props> = ({ account }) => {
  const enabled = account.type === AccountType.Bank;

  const { data } = useQuery({
    queryKey: ['account-drafts', account.id],
    queryFn: () =>
      transactionService.fetchList({
        page: 1,
        perPage: 1,
        filters: new TransactionFilters({ accounts: [String(account.id)], isDraft: true }),
        sort: {} as Sorting,
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
          className="inline-block w-2 h-2 rounded-full bg-amber-500 shrink-0 ring-1 ring-background select-none"
        />
      </TooltipTrigger>
      <TooltipContent>
        {count} pending draft transaction{count !== 1 ? 's' : ''}
      </TooltipContent>
    </Tooltip>
  );
};

export default AccountDraftBadge;
