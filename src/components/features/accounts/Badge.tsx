import { CreditCard, Globe, HelpCircle, Wallet } from 'lucide-react';
import React from 'react';

import AccountDetailsHoverCard from '@/components/features/accounts/DetailsHoverCard';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { cn } from '@/lib/utils';
import Account, { AccountType } from '@/models/Account';

interface AccountBadgeProps {
  account: Account;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
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

const widthMap = {
  sm: 'max-w-[120px]',
  md: 'max-w-[160px]',
  lg: 'max-w-[200px]',
};

const getContrastColor = (hexColor: string): 'black' | 'white' => {
  hexColor = hexColor.replace('#', '');
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
};

export const AccountBadge: React.FC<AccountBadgeProps> = ({
                                                            account,
                                                            size = 'md',
                                                            className,
                                                          }) => {
  const { type, color, nameWithCurrency } = account;
  const Icon = iconMap[type];

  const badgeColor = account.isArchived() ? 'var(--muted-foreground)' : color;
  const textColor = account.isArchived() ? 'var(--muted-foreground)' : getContrastColor(color);

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1',
        'transition-all duration-200 ease-in-out',
        'hover:opacity-90',
        sizeMap[size],
        widthMap[size],
        className,
      )}
      style={{
        backgroundColor: badgeColor,
        color: textColor,
        borderColor: 'transparent',
      }}
    >
      <Icon className={cn(iconSizeMap[size])} />
      <span className="font-medium truncate">{nameWithCurrency}</span>
    </Badge>
  );

  return (
    <ResponsiveTooltip
      desktopComponent="hovercard"
      contentClassName="bg-transparent border-none"
      openDelay={0}
      content={<AccountDetailsHoverCard account={account} />}>
      <span>
        {badgeContent}
      </span>
    </ResponsiveTooltip>
  );
};

export default AccountBadge;
