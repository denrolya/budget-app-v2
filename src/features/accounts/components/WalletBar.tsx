import React, { useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountPill from '@/features/accounts/components/Pill';
import ResponsiveTooltip from '@/components/ui/responsive-tooltip';
import { useBaseCurrency } from '@/features/auth';
import { useAccounts } from '@/hooks/financeData';
import { cn } from '@/lib/utils';
import { Account, ACCOUNT_TYPES_ORDER } from '@/features/accounts';

type Props = {
  className?: string;
};

type AccountSegment = {
  key: string;
  account: Account;
  typeLabel: string;
  baseValue: number;
  percent: number; // 0..100
  isTypeBoundary: boolean; // first account of a type, except the first type rendered
};

const MIN_PERCENT_TO_RENDER = 0.05; // keep tiny accounts visible
const MIN_PERCENT_FOR_LABEL = 7; // show account pill only if there is room

export const WalletBar: React.FC<Props> = ({ className }) => {
  const baseCurrency = useBaseCurrency();
  const accounts = useAccounts();

  const { totalBaseValue, segments, accountsShown } = useMemo(() => {
    const visible = (accounts ?? [])
      .filter((account) => !account.isArchived())
      .map((account) => ({
        account,
        baseValue: account.convertedValues?.[baseCurrency] ?? 0,
      }))
      .filter((x) => x.baseValue > 0);

    const total = visible.reduce((sum, x) => sum + x.baseValue, 0);
    if (total <= 0) return { totalBaseValue: 0, segments: [] as AccountSegment[], accountsShown: visible.length };

    const out: AccountSegment[] = [];
    let isFirstTypeRendered = true;

    for (const type of ACCOUNT_TYPES_ORDER) {
      const group = visible.filter((x) => x.account.type === type);
      if (!group.length) continue;

      group.sort((a, b) => b.baseValue - a.baseValue);

      let emittedInType = false;

      for (let index = 0; index < group.length; index++) {
        const { account, baseValue } = group[index];
        const percent = (baseValue / total) * 100;
        if (percent < MIN_PERCENT_TO_RENDER) continue;

        out.push({
          key: `account-${account.id}`,
          account,
          typeLabel: String(type),
          baseValue,
          percent,
          isTypeBoundary: !isFirstTypeRendered && !emittedInType,
        });

        emittedInType = true;
      }

      if (emittedInType) isFirstTypeRendered = false;
    }

    return { totalBaseValue: total, segments: out, accountsShown: visible.length };
  }, [accounts, baseCurrency]);

  if (!segments.length || totalBaseValue <= 0) {
    return (
      <div className={cn('rounded-lg border bg-card p-4 text-sm text-muted-foreground', className)}>
        No accounts with positive balance.
      </div>
    );
  }

  return (
    <section className={cn('rounded-xl border bg-card text-card-foreground p-4', className)}>
      <header className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">Your wallet</div>
          <MoneyValue
            amount={totalBaseValue}
            className="text-2xl font-semibold tracking-tight"
            currency={baseCurrency as any}
            showValuesTooltip={false}
            useColors={false}
            values={{ [baseCurrency]: totalBaseValue }}
          />
        </div>

        <div className="text-xs text-muted-foreground">Accounts shown: {accountsShown}</div>
      </header>

      <div
        aria-label="Wallet distribution by accounts"
        className={cn('w-full', 'overflow-hidden', 'rounded-lg border bg-background/40')}
        role="group"
      >
        <div className="flex h-12 w-full items-stretch">
          {segments.map((segment) => {
            const showAccountLabel = segment.percent >= MIN_PERCENT_FOR_LABEL;

            const tooltipContent = (
              <div className="space-y-1">
                <AccountPill account={segment.account} tooltip={false} variant="inline" />
                <div className="text-xs text-muted-foreground capitalize">Type: {segment.typeLabel}</div>

                <div className="pt-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Balance</span>
                    <MoneyValue
                      amount={segment.account.balance}
                      currency={segment.account.currency as any}
                      useColors={false}
                      values={segment.account.convertedValues ?? {}}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">{segment.percent.toFixed(2)}% of wallet</div>
              </div>
            );

            return (
              <div
                key={segment.key}
                aria-label={`${segment.account.displayName}, ${segment.percent.toFixed(2)} percent`}
                className={cn(
                  'relative h-full min-w-0',
                  // type boundary divider (does not consume width)
                  segment.isTypeBoundary && 'border-l border-border/70',
                )}
                role="img"
                style={{ flex: `0 0 ${segment.percent}%` }}
              >
                <ResponsiveTooltip
                  content={tooltipContent}
                  contentClassName="max-w-[22rem]"
                  desktopComponent="hovercard"
                  openDelay={150}
                  triggerClassName="block h-full w-full"
                >
                  <span
                    className={cn(
                      'block h-full w-full',
                      'transition-[filter,outline-color] duration-150',
                      'outline outline-1 outline-transparent hover:outline-foreground/15',
                    )}
                    style={{ backgroundColor: segment.account.color }}
                  />
                </ResponsiveTooltip>

                {showAccountLabel && (
                  <div className="pointer-events-none absolute left-1 top-1">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        'rounded-md border bg-background/80 px-2 py-0.5',
                        'text-[11px] font-medium leading-none shadow-sm',
                        'backdrop-blur supports-[backdrop-filter]:bg-background/60',
                      )}
                    >
                      <AccountPill account={segment.account} showMarker={false} tooltip={false} variant="inline" />
                      <span className="text-muted-foreground tabular-nums">{segment.percent.toFixed(0)}%</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

WalletBar.displayName = 'WalletBar';

export default WalletBar;
