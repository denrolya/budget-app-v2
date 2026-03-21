import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type Account from '@/features/accounts/models/Account';
import { Type as AccountType } from '@/features/accounts/types';

interface Props {
  account: Account;
}

/** Small dot indicating pending draft transactions for a bank account. Zero layout impact. */
const AccountDraftBadge: React.FC<Props> = ({ account }) => {
  const count = account.draftCount;
  if (account.type !== AccountType.Bank || count === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={`${count} pending draft transaction${count !== 1 ? 's' : ''}`}
          className="inline-block w-2 h-2 rounded-full bg-warning shrink-0 ring-1 ring-background select-none"
        />
      </TooltipTrigger>
      <TooltipContent>
        {count} pending draft transaction{count !== 1 ? 's' : ''}
      </TooltipContent>
    </Tooltip>
  );
};

export default AccountDraftBadge;
