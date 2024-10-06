import { CreditCard, Globe, HelpCircle, Wallet } from 'lucide-react';
import React from 'react';
import cn from 'classnames';

import AccountDetailsHoverCard from '@/components/features/accounts/DetailsHoverCard';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import Account, { AccountType } from '@/models/Account';

interface AccountBadgeProps {
  account: Account;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tooltip?: boolean;
}

const iconMap: Record<AccountType, React.ElementType> = {
  internet: Globe,
  cash: Wallet,
  bank: CreditCard,
  other: HelpCircle,
};

const sizeMap = {
  sm: 'h-5 text-xs py-0 px-1.5',
  md: 'h-6 text-sm py-0.5 px-2',
  lg: 'h-7 text-base py-0.5 px-2.5',
};

const iconSizeMap = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
};

const maxWidthMap = {
  sm: 'max-w-[120px]',
  md: 'max-w-[160px]',
  lg: 'max-w-[200px]',
};

const charLimitMap = {
  sm: 15,
  md: 20,
  lg: 25,
};

const getContrastColor = (hexColor: string): 'black' | 'white' => {
  hexColor = hexColor.replace('#', '');
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
};

export default function AccountBadge({
                                       account,
                                       size = 'md',
                                       className,
                                       tooltip = true,
                                     }: AccountBadgeProps) {
  const { type, color, nameWithCurrency } = account;
  const Icon = iconMap[type];

  const badgeColor = account.isArchived() ? 'var(--muted-foreground)' : color;
  const textColor = account.isArchived() ? 'var(--muted-foreground)' : getContrastColor(color);

  const truncatedText = truncateText(nameWithCurrency, charLimitMap[size]);

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center shadow-md',
        'transition-all duration-200 ease-in-out',
        'hover:opacity-90',
        'w-fit',
        sizeMap[size],
        maxWidthMap[size],
        className
      )}
      style={{
        backgroundColor: badgeColor,
        color: textColor,
        borderColor: 'transparent',
      }}
    >
      <div className="flex items-center gap-1 min-w-0">
        <Icon className={cn(iconSizeMap[size], 'flex-shrink-0')} />
        <span className="font-medium truncate">{truncatedText}</span>
      </div>
    </Badge>
  );

  return (
    <ResponsiveTooltip
      desktopComponent="hovercard"
      triggerClassName={cn({
        'cursor-pointer': tooltip,
      })}
      contentClassName="bg-transparent border-none shadow-none"
      openDelay={0}
      content={tooltip ? <AccountDetailsHoverCard account={account} /> : null}
    >
      <span className="inline-block">
        {badgeContent}
      </span>
    </ResponsiveTooltip>
  );
}
