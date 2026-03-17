import React from 'react';

import { cn } from '@/lib/utils';
import type Account from '@/features/accounts/models/Account';

import { type Type as AccountType } from '../types';

type ShapeKind = 'circle' | 'square' | 'diamond' | 'hollow-square';

const SHAPE_BY_TYPE: Record<AccountType, ShapeKind> = {
  bank: 'square',
  cash: 'circle',
  internet: 'diamond',
  basic: 'hollow-square',
};

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-4 w-4', // intentionally same as md — marker stays fixed while the pill badge grows
};

interface Props {
  account: Account;
  size?: 'sm' | 'md' | 'lg';
}

const AccountMarker: React.FC<Props> = ({ account, size = 'sm' }) => {
  const shape = SHAPE_BY_TYPE[account.type];
  const isHollow = shape === 'hollow-square';
  const isArchived = account.isArchived();
  const color = isArchived ? 'hsl(var(--muted-foreground))' : account.color;

  const integration = account.bankIntegration;
  const integrationColor = integration ? (integration.isActive ? 'hsl(var(--success))' : 'hsl(var(--warning))') : null;

  return (
    <span className={cn('relative inline-flex shrink-0 flex-none align-middle', SIZE_CLASS[size])}>
      <span
        aria-hidden
        style={{
          clipPath: shape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : undefined,
          backgroundColor: isHollow ? 'transparent' : color,
          boxShadow: `inset 0 0 0 1px ${color}`,
        }}
        className={cn('absolute inset-0', {
          'rounded-full': shape === 'circle',
          'rounded-[0.2rem]': shape !== 'diamond' && shape !== 'circle',
        })}
      />
      {integrationColor && (
        <span
          aria-hidden
          style={{ backgroundColor: integrationColor }}
          className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-background z-10"
        />
      )}
    </span>
  );
};

export default AccountMarker;
