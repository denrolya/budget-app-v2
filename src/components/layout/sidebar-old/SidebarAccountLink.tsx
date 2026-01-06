import cn from 'classnames';
import { memo } from 'react';
import { Link } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import AccountPill from '@/features/accounts/components/Pill';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Account from '@/models/Account';
import AccountDetailsHoverCard from '@/features/accounts/components/DetailsHoverCard';

interface SidebarAccountLinkProps {
  account: Account;
  isSidebarExpanded: boolean;
}

export const SidebarAccountLink: React.FC<SidebarAccountLinkProps> = ({ account, isSidebarExpanded }) => (
  <Tooltip delayDuration={1}>
    <TooltipTrigger asChild>
      <Link
        to={`/accounts/${account.id}`}
        className={cn(
          'flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          {
            'justify-center': !isSidebarExpanded,
          },
        )}
      >
        <div
          className={cn('flex items-center justify-center', {
            'w-4 h-4': !isSidebarExpanded,
            'w-8 h-8': isSidebarExpanded,
          })}
        >
          <AccountPill size="sm" account={account} />
        </div>
        {isSidebarExpanded && (
          <div className="flex-grow min-w-0 ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{account.displayName}</p>
            <MoneyValue
              revert
              showValuesTooltip={false}
              showSign={false}
              maximumFractionDigits={2}
              className={cn('items-center text-xs text-mono', {
                'text-destructive': account.balance < 0,
                'text-success': account.balance > 0,
                'text-muted-foreground': account.balance === 0,
              })}
              amount={account.balance}
              currency={account.currency}
              values={account.convertedValues}
            />
          </div>
        )}
      </Link>
    </TooltipTrigger>
    <TooltipContent side="right" align="start" sideOffset={5} alignOffset={-8}>
      <AccountDetailsHoverCard account={account} />
    </TooltipContent>
  </Tooltip>
);

SidebarAccountLink.displayName = 'SidebarAccountLink';

export default memo(
  SidebarAccountLink,
  (prevProps, nextProps) =>
    prevProps.isSidebarExpanded === nextProps.isSidebarExpanded &&
    prevProps.account.id === nextProps.account.id &&
    prevProps.account.balance === nextProps.account.balance,
);
