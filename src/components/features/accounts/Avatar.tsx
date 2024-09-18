import cn from 'classnames';
import { CreditCard, Globe, HelpCircle, Wallet } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type AccountType = 'internet' | 'cash' | 'bank' | 'other'

interface AccountAvatarProps {
  account: {
    type: AccountType
    color: string
    currency: string
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCurrency?: boolean;
}

const iconMap: Record<AccountType, React.ElementType> = {
  internet: Globe,
  cash: Wallet,
  bank: CreditCard,
  other: HelpCircle,
};

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const iconSizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-6 w-6',
};

const currencySizeMap = {
  sm: 'text-[6px] h-2.5',
  md: 'text-[8px] h-3',
  lg: 'text-xs h-4',
};

export const AccountAvatar: React.FC<AccountAvatarProps> = ({
                                                              account,
                                                              size = 'md',
                                                              showCurrency = true,
                                                              className,
                                                            }) => {
  const { type, color, currency } = account;
  const Icon = iconMap[type];

  return (
    <div className={cn('relative inline-block', sizeMap[size])}>
      <Avatar className={cn('bg-background w-full h-full', className)}>
        <AvatarFallback
          className="bg-background flex items-center justify-center"
          style={{
            boxShadow: `inset 0 0 0 1px ${color}`,
          }}
        >
          <Icon
            className={cn(iconSizeMap[size], 'text-foreground')}
            style={{ color: color + '80' }}  // Adding 80 for 50% opacity
          />
        </AvatarFallback>
      </Avatar>
      {showCurrency && (
        <div
          className={cn(
            'absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/3',
            'rounded-full bg-background px-1 flex items-center justify-center',
            currencySizeMap[size],
            'border border-background',
          )}
          style={{
            color,
            boxShadow: `0 0 0 1px ${color}`,
          }}
        >
          {currency}
        </div>
      )}
    </div>
  );
};

export default AccountAvatar;
