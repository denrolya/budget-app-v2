import { FC, memo } from 'react';
import cn from 'classnames';
import { Link } from 'react-router-dom';

import { MoneyValue } from '@/components/common/MoneyValue';
import AccountAvatar from '@/components/features/accounts/Avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  lastTransaction: string;
  accountNumber: string;
  color: string;
  icon?: string;
}

interface SidebarAccountLinkProps {
  account: Account;
  isSidebarExpanded: boolean;
}

export const SidebarAccountLink: FC<SidebarAccountLinkProps> = ({ account, isSidebarExpanded }) => (
  <Tooltip delayDuration={0}>
    <TooltipTrigger asChild>
      <Link
        to={`/accounts/${account.id}`}
        className={cn('flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          {
            'justify-center': !isSidebarExpanded,
          }
        )}
      >
        <div className={cn('flex items-center justify-center', isSidebarExpanded ? 'w-6 h-6' : 'w-8 h-8')}>
          <AccountAvatar account={account} className="w-full h-full" size="sm" />
        </div>
        {isSidebarExpanded && (
          <div className="flex-grow min-w-0 ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{account.name}</p>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <MoneyValue amount={account.balance} currency={account.currency} />
              <span>{account.currency}</span>
            </div>
          </div>
        )}
      </Link>
    </TooltipTrigger>
    <TooltipContent
      side="right"
      align="start"
      sideOffset={5}
      alignOffset={-8}
      className="p-0 bg-transparent border-none shadow-none"
    >
      <Card className="w-64 bg-popover text-popover-foreground">
        <CardContent className="p-4">
          <h3 className="font-bold mb-2">{account.name}</h3>
          <p className="text-sm mb-1">Balance: <MoneyValue amount={account.balance} currency={account.currency} /></p>
          <p className="text-sm mb-1">Last Transaction: {account.lastTransaction}</p>
          <p className="text-sm">Account Number: {account.accountNumber}</p>
        </CardContent>
      </Card>
    </TooltipContent>
  </Tooltip>
);

SidebarAccountLink.displayName = 'SidebarAccountLink';

export default memo(SidebarAccountLink, (prevProps, nextProps) =>
  prevProps.isSidebarExpanded === nextProps.isSidebarExpanded &&
  prevProps.account.id === nextProps.account.id &&
  prevProps.account.balance === nextProps.account.balance
);
