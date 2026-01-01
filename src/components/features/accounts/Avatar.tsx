import cn from 'classnames';
import React, { useMemo } from 'react';

import Account from '@/models/Account';
import { Type as AccountType } from '@/types/account';

interface AccountAvatarProps {
  account: Account;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCurrency?: boolean; // keep prop for compatibility; unused
}

// “marker-sized” footprints (sm becomes tiny bullet, not avatar)
const sizeMap = {
  sm: 'h-3 w-3', // tiny
  md: 'h-4 w-4', // still small
  lg: 'h-4 w-4', // map to md
} as const;

type ShapeKind = 'circle' | 'square' | 'diamond' | 'hollow-square';

const shapeKindByType: Record<AccountType, ShapeKind> = {
  bank: 'square',
  cash: 'circle',
  internet: 'diamond',
  basic: 'hollow-square',
};

const shapeClass: Record<ShapeKind, string> = {
  circle: 'rounded-full',
  square: 'rounded-[0.2rem]',
  'hollow-square': 'rounded-[0.2rem]',
  // diamond uses clip-path, so no rounding class needed
  diamond: '',
};

export const AccountAvatar: React.FC<AccountAvatarProps> = ({
                                                              account,
                                                              size = 'md',
                                                              className,
                                                            }) => {
  const normalizedSize = size === 'lg' ? 'md' : size;
  const isArchived = account.isArchived();
  const color = isArchived ? 'var(--muted-foreground)' : account.color;

  const shape = shapeKindByType[account.type];

  const ariaLabel = useMemo(() => {
    const parts = [account.displayName, `type ${account.type}`, `currency ${account.currency}`];
    if (isArchived) parts.push('archived');
    return parts.join(', ');
  }, [account.displayName, account.type, account.currency, isArchived]);

  const isHollow = shape === 'hollow-square' || isArchived;

  return (
    <span
      className={cn(
        'inline-block shrink-0 align-middle',
        // prevent any layout weirdness in flex rows
        'flex-none',
        sizeMap[normalizedSize],
        shapeClass[shape],
        className,
      )}
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        // diamond rendered via clip-path, others via border-radius
        clipPath: shape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : undefined,

        backgroundColor: isHollow ? 'transparent' : color,
        boxShadow: `inset 0 0 0 1px ${color}`,
      }}
    />
  );
};

export default AccountAvatar;
