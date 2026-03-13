import { ResponsiveTreeMap } from '@nivo/treemap';
import React, { useMemo } from 'react';

import { useBaseCurrency } from '@/features/auth';
import { useActiveAccounts } from '@/hooks/financeData';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  groupBy: 'type' | 'currency';
  onNavigate?: (accountId: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  cash: 'Cash',
  internet: 'Online',
  basic: 'Other',
};

const resolveCssVar = (value: string): string => {
  if (typeof window === 'undefined' || !value.startsWith('var(')) return value;
  const name = value.replace(/^var\(/, '').replace(/\)$/, '').trim();
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
};

// ── Component ─────────────────────────────────────────────────────────────────

const AccountsTreemap: React.FC<Props> = ({ groupBy, onNavigate }) => {
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();

  const { treeData, colorMap, total } = useMemo(() => {
    const total = accounts.reduce((s, acc) => s + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0);
    const byGroup = new Map<string, typeof accounts>();

    for (const acc of accounts) {
      const groupKey = groupBy === 'type' ? acc.type : acc.currency;
      const list = byGroup.get(groupKey) ?? [];
      list.push(acc);
      byGroup.set(groupKey, list);
    }

    const colorMap = new Map<string, string>();

    const children = Array.from(byGroup.entries()).map(([groupKey, accs]) => ({
      name: groupBy === 'type' ? (TYPE_LABELS[groupKey] ?? groupKey) : groupKey,
      children: accs.map((acc) => {
        const color = resolveCssVar(acc.color);
        colorMap.set(acc.id.toString(), color);
        return {
          name: acc.id.toString(),
          displayName: acc.name,
          value: Math.max(Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0.001),
          rawBalance: acc.balance,
          currency: acc.currency,
          accountId: acc.id,
        };
      }),
    }));

    return {
      treeData: { name: 'root', children },
      colorMap,
      total,
    };
  }, [accounts, baseCurrency, groupBy]);

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: baseCurrency,
        maximumFractionDigits: 0,
      }),
    [baseCurrency],
  );

  if (!accounts.length) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No accounts</div>
    );
  }

  return (
    <div className="h-full w-full" style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
      <ResponsiveTreeMap
        data={treeData}
        identity="name"
        value="value"
        valueFormat={(v) => fmt.format(v)}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        tile="squarify"
        innerPadding={3}
        outerPadding={6}
        motionConfig="gentle"
        enableParentLabel={false}
        labelSkipSize={28}
        colors={(node) => colorMap.get(node.id) ?? '#888'}
        borderWidth={0}
        label={(node) => (node.data as any).displayName ?? node.id}
        labelTextColor={{ from: 'color', modifiers: [['brighter', 3]] }}
        tooltip={({ node }) => {
          const d = node.data as any;
          if (!d.accountId) return null;
          const pct = total > 0 ? ((node.value / total) * 100).toFixed(1) : '0';
          const nativeFmt = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: d.currency,
            maximumFractionDigits: d.currency === 'BTC' || d.currency === 'ETH' ? 6 : 2,
          });
          return (
            <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm min-w-[160px] pointer-events-none">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  aria-hidden
                  style={{ backgroundColor: colorMap.get(node.id) ?? '#888' }}
                  className="inline-block h-2 w-2 rounded-full flex-none"
                />
                <span className="font-medium text-foreground truncate">{d.displayName}</span>
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="tabular-nums font-medium">{nativeFmt.format(Math.abs(d.rawBalance))}</span>
                </div>
                {d.currency !== baseCurrency && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">≈ {baseCurrency}</span>
                    <span className="tabular-nums text-muted-foreground">{fmt.format(node.value)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 border-t pt-0.5 mt-0.5">
                  <span className="text-muted-foreground">Share</span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
              </div>
            </div>
          );
        }}
        onClick={(node) => {
          const d = node.data as any;
          if (d.accountId && onNavigate) onNavigate(d.accountId);
        }}
      />
    </div>
  );
};

export default React.memo(AccountsTreemap);
