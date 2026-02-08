import cn from 'classnames';
import React, { useMemo } from 'react';

import AccountDetailsHoverCard from '@/features/accounts/components/DetailsHoverCard';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { useAccounts } from '@/hooks/financeData';
import Account from '@/features/accounts/models/Account';
import { Type as AccountType } from '@/features/accounts';

type PillVariant = 'pill' | 'inline';
type Tone = 'subtle' | 'filled';

export interface AccountPillProps {
  account: Account;
  size?: 'sm' | 'md' | 'lg';

  /** Presentation */
  variant?: PillVariant;
  tone?: Tone;

  /** Parts */
  showMarker?: boolean;
  showName?: boolean;

  /** Inline-only: allow overriding typography without forcing defaults */
  textClassName?: string;

  /** Behavior */
  tooltip?: boolean;

  className?: string;
}

type ShapeKind = 'circle' | 'square' | 'diamond' | 'hollow-square';

const shapeKindByType: Record<AccountType, ShapeKind> = {
  bank: 'square',
  cash: 'circle',
  internet: 'diamond',
  basic: 'hollow-square',
};

const sizeMap = {
  sm: {
    badge: 'h-6 px-2',
    text: 'text-xs font-medium',
    marker: 'h-3 w-3',
  },
  md: {
    badge: 'h-7 px-2.5',
    text: 'text-sm font-medium',
    marker: 'h-4 w-4',
  },
  lg: {
    badge: 'h-8 px-3',
    text: 'text-sm font-semibold',
    marker: 'h-4 w-4',
  },
} as const;

const Marker = ({ account, size }: { account: Account; size: 'sm' | 'md' | 'lg' }) => {
  const isArchived = account.isArchived();
  const color = isArchived ? 'hsl(var(--muted-foreground))' : account.color;

  const shape = shapeKindByType[account.type];
  const isHollow = shape === 'hollow-square';

  return (
    <span
      aria-hidden="true"
      style={{
        clipPath: shape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : undefined,
        backgroundColor: isHollow ? 'transparent' : color,
        boxShadow: `inset 0 0 0 1px ${color}`,
      }}
      className={cn(
        'inline-block shrink-0 flex-none align-middle',
        sizeMap[size].marker,
        shape !== 'diamond' && (shape === 'circle' ? 'rounded-full' : 'rounded-[0.2rem]'),
      )}
    />
  );
};

const getContrastColor = (hex: string): 'black' | 'white' => {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? 'black' : 'white';
};

export const AccountPill: React.FC<AccountPillProps> = ({
                                                          account,
                                                          size = 'md',
                                                          variant = 'pill',
                                                          tone = 'subtle',
                                                          showMarker = true,
                                                          showName = true,
                                                          textClassName,
                                                          tooltip = true,
                                                          className,
                                                        }) => {
  const accounts = useAccounts();

  const resolvedAccount = useMemo(() => {
    const id = String(account.id);
    return accounts.find((a) => String(a.id) === id) ?? account;
  }, [accounts, account]);

  const isArchived = resolvedAccount.isArchived();
  const accentColor = isArchived ? 'var(--muted-foreground)' : resolvedAccount.color;

  const ariaLabel = useMemo(() => {
    const parts = [
      resolvedAccount.displayName,
      `type ${resolvedAccount.type}`,
      `currency ${resolvedAccount.currency}`,
    ];
    if (isArchived) parts.push('archived');
    return parts.join(', ');
  }, [resolvedAccount.displayName, resolvedAccount.type, resolvedAccount.currency, isArchived]);

  const isInline = variant === 'inline';
  const isFilled = tone === 'filled' && !isInline;

  // Filled pill: marker in same color is redundant; BUT archived should still show it (muted marker is useful).
  const effectiveShowMarker = showMarker && (!isFilled || isArchived);

  const nameNode = showName ? (
    <span
      className={cn(
        'min-w-0 truncate',
        isInline ? 'leading-none' : sizeMap[size].text,
        textClassName,
      )}
    >
      {resolvedAccount.displayName}
    </span>
  ) : null;

  const content = (
    <>
      {effectiveShowMarker && <Marker account={resolvedAccount} size={size} />}
      {nameNode}
    </>
  );

  const inlineNode = (
    <span
      aria-label={ariaLabel}
      role="note"
      title={ariaLabel}
      className={cn(
        'inline-flex items-center gap-2 min-w-0 max-w-full align-middle',
        isArchived && 'opacity-70',
        className,
      )}
    >
      {content}
    </span>
  );

  const pillNode = (
    <Badge
      aria-label={ariaLabel}
      role="note"
      title={ariaLabel}
      variant="outline"
      style={
        isFilled
          ? {
            backgroundColor: accentColor,
            borderColor: 'transparent',
            color: getContrastColor(accentColor) === 'white' ? 'white' : 'black',
          }
          : undefined
      }
      className={cn(
        'inline-flex items-center gap-2 min-w-0 max-w-full',
        'border-border',
        sizeMap[size].badge,
        isArchived && 'opacity-70',
        className,
      )}
    >
      {content}
    </Badge>
  );

  const node = isInline ? inlineNode : pillNode;

  if (!tooltip) return node;

  return (
    <ResponsiveTooltip
      desktopComponent="hovercard"
      openDelay={0}
      content={<AccountDetailsHoverCard account={resolvedAccount} />}
      contentClassName="p-2 rounded-lg"
      triggerClassName="cursor-help flex items-center"
    >
      <span className="inline-flex max-w-full">{node}</span>
    </ResponsiveTooltip>
  );
};

export default AccountPill;
