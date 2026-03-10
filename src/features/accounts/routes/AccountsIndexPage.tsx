import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CURRENCIES } from '@/constants/currency';
import { useBaseCurrency } from '@/features/auth';
import { useActiveAccounts } from '@/hooks/financeData';

import AccountsSunburstChart, { type HoveredSunburstNode } from '../components/AccountsSunburstChart';
import Account from '../models/Account';

// ─── Types ────────────────────────────────────────────────────────────────────

type CurrencyGroup = {
  currency: string;
  symbol: string;
  color: string;
  total: number;
  percentage: number;
  accounts: Account[];
};

type TypeGroup = {
  type: string;
  total: number;
  percentage: number;
};

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  cash: 'Cash',
  internet: 'Online',
  basic: 'Other',
};

// ─── Component ────────────────────────────────────────────────────────────────

const AccountsIndexPage: React.FC = () => {
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<HoveredSunburstNode | null>(null);

  const handleHoverChange = useCallback((node: HoveredSunburstNode | null) => {
    setHovered(node);
  }, []);

  const { walletTotal, currencyGroups, typeGroups } = useMemo(() => {
    const grouped = new Map<string, Account[]>();
    const typeMap = new Map<string, number>();

    for (const acc of accounts) {
      const bucket = grouped.get(acc.currency) ?? [];
      bucket.push(acc);
      grouped.set(acc.currency, bucket);

      const converted = Math.abs(acc.convertedValues?.[baseCurrency] ?? 0);
      typeMap.set(acc.type, (typeMap.get(acc.type) ?? 0) + converted);
    }

    const total = accounts.reduce(
      (sum, acc) => sum + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0),
      0,
    );

    const groups: CurrencyGroup[] = [];
    for (const [currency, accs] of grouped) {
      const currencyTotal = accs.reduce(
        (sum, acc) => sum + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0),
        0,
      );
      const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES];
      const color =
        typeof window !== 'undefined'
          ? getComputedStyle(document.documentElement)
              .getPropertyValue(`--account-bank-${currency}`)
              .trim() || '#888'
          : '#888';

      const sortedAccs = accs
        .slice()
        .sort(
          (a, b) =>
            Math.abs(b.convertedValues?.[baseCurrency] ?? b.balance) -
            Math.abs(a.convertedValues?.[baseCurrency] ?? a.balance),
        );

      groups.push({
        currency,
        symbol: currencyInfo?.symbol ?? currency,
        color,
        total: currencyTotal,
        percentage: total > 0 ? (currencyTotal / total) * 100 : 0,
        accounts: sortedAccs,
      });
    }
    groups.sort((a, b) => b.total - a.total);

    const types: TypeGroup[] = Array.from(typeMap.entries())
      .map(([type, value]) => ({
        type,
        total: value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return { walletTotal: total, currencyGroups: groups, typeGroups: types };
  }, [accounts, baseCurrency]);

  const centerInfo = useMemo(() => {
    if (!hovered) {
      return {
        label: 'Total balance',
        value: walletTotal,
        currency: baseCurrency,
        sub: `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`,
        color: null as string | null,
      };
    }

    const node = hovered.data;
    const isAccount = node.rawBalance !== undefined;

    if (isAccount) {
      return {
        label: node.name,
        value: Math.abs(node.rawBalance ?? 0),
        currency: node.currency ?? baseCurrency,
        sub:
          node.convertedValue != null && node.currency !== baseCurrency
            ? `≈ ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: baseCurrency,
                maximumFractionDigits: 0,
              }).format(Math.abs(node.convertedValue))}`
            : `${hovered.percentage.toFixed(1)}% of wallet`,
        color: hovered.color,
      };
    }

    const currencyCode = node.currency ?? String(hovered.id);
    const currencyInfo = CURRENCIES[currencyCode as keyof typeof CURRENCIES];
    return {
      label: currencyInfo ? `${currencyInfo.symbol} ${currencyCode}` : String(hovered.id),
      value: hovered.value,
      currency: baseCurrency,
      sub: `${hovered.percentage.toFixed(1)}% of wallet`,
      color: hovered.color,
    };
  }, [hovered, walletTotal, baseCurrency, accounts.length]);

  const formatCenter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: centerInfo.currency,
    maximumFractionDigits:
      centerInfo.currency === 'BTC' || centerInfo.currency === 'ETH' ? 6 : 0,
  });

  return (
    <div className="flex h-full flex-col bg-muted overflow-hidden">
      <div className="flex-1 min-h-0 p-4 animate-in fade-in slide-in-from-bottom-4 duration-[350ms] ease-out">
        <Card className="h-full overflow-hidden flex flex-col">
          {/* Stats strip */}
          <div className="flex-none border-b px-5 py-2.5 flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{accounts.length}</span> account
              {accounts.length !== 1 ? 's' : ''}
            </span>
            <div aria-hidden className="h-3.5 w-px bg-border" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{currencyGroups.length}</span> currenc
              {currencyGroups.length !== 1 ? 'ies' : 'y'}
            </span>
            {currencyGroups[0] && (
              <>
                <div aria-hidden className="h-3.5 w-px bg-border" />
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    aria-hidden
                    style={{ backgroundColor: currencyGroups[0].color }}
                    className="inline-block h-1.5 w-1.5 rounded-full flex-none"
                  />
                  {currencyGroups[0].currency} leads at{' '}
                  <span className="font-semibold text-foreground">
                    {currencyGroups[0].percentage.toFixed(0)}%
                  </span>
                </span>
              </>
            )}
          </div>

          {/* Chart + right panel */}
          <CardContent className="flex flex-1 min-h-0 min-w-0 overflow-hidden p-0">
            {/* Sunburst + center overlay */}
            <div className="relative min-h-0 min-w-0 flex-[1_1_0%] basis-0 overflow-hidden">
              <AccountsSunburstChart onHoverChange={handleHoverChange} />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center text-center px-8 py-5 rounded-full bg-background/80 backdrop-blur-sm max-w-[240px] transition-all duration-100">
                  {centerInfo.color && (
                    <span
                      aria-hidden
                      style={{ backgroundColor: centerInfo.color }}
                      className="inline-block h-2.5 w-2.5 rounded-full mb-2 flex-none"
                    />
                  )}
                  <p className="text-xs text-muted-foreground leading-tight mb-1.5 truncate w-full">
                    {centerInfo.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground leading-tight tabular-nums">
                    {formatCenter.format(centerInfo.value)}
                  </p>
                  {centerInfo.sub && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-tight">
                      {centerInfo.sub}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div aria-hidden className="flex-none w-px bg-border self-stretch my-3" />

            {/* Right panel */}
            <div className="w-56 lg:w-64 shrink-0 flex flex-col min-h-0 min-w-0 overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="space-y-5 p-4 pb-3">
                  {currencyGroups.map((group, groupIdx) => (
                    <div
                      key={group.currency}
                      style={{ animationDelay: `${100 + groupIdx * 70}ms` }}
                      className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out [animation-fill-mode:both]"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden
                            style={{ backgroundColor: group.color }}
                            className="h-2.5 w-2.5 rounded-sm flex-none"
                          />
                          <span className="text-sm font-semibold text-foreground">
                            {group.symbol} {group.currency}
                          </span>
                        </div>
                        <div className="text-right text-xs tabular-nums">
                          <span className="font-semibold text-foreground">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: baseCurrency,
                              maximumFractionDigits: 0,
                            }).format(group.total)}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            {group.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5 pl-[18px]">
                        {group.accounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            className="w-full flex items-center justify-between text-xs text-muted-foreground gap-2 hover:text-foreground hover:bg-muted rounded px-1.5 py-1 transition-colors cursor-pointer text-left"
                            onClick={() => navigate(`/accounts/${acc.id}`)}
                          >
                            <span className="truncate">{acc.name}</span>
                            <MoneyValue
                              amount={acc.balance}
                              currency={acc.currency as any}
                              useColors={false}
                              values={{}}
                              className="text-xs tabular-nums shrink-0"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {typeGroups.length > 0 && (
                <div
                  style={{ animationDelay: '300ms' }}
                  className="flex-none border-t p-4 space-y-2.5 animate-in fade-in duration-300 ease-out [animation-fill-mode:both]"
                >
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    By account type
                  </p>
                  {typeGroups.map(({ type, percentage }) => (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{TYPE_LABELS[type] ?? type}</span>
                        <span className="font-medium text-foreground tabular-nums">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-primary rounded-full transition-[width] duration-500 ease-out"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountsIndexPage;
