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
  bank: 'BANK',
  cash: 'CASH',
  internet: 'NET',
  basic: 'OTHER',
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
      name: groupBy === 'type' ? (TYPE_LABELS[groupKey] ?? groupKey.toUpperCase()) : groupKey,
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

    return { treeData: { name: 'root', children }, colorMap, total };
  }, [accounts, baseCurrency, groupBy]);

  const fmt = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency, maximumFractionDigits: 0 }),
    [baseCurrency],
  );

  if (!accounts.length) {
    return (
      <div className="h-full flex items-center justify-center text-2xs font-mono text-muted-foreground/50 uppercase tracking-widest">
        NO DATA
      </div>
    );
  }

  return (
    <div style={{ cursor: onNavigate ? 'pointer' : 'default' }} className="h-full w-full animate-in fade-in zoom-in-95 duration-500 ease-out [animation-fill-mode:both]">
      <ResponsiveTreeMap
        borderColor="hsl(var(--background))"
        borderWidth={2}
        colors={(node) => colorMap.get(node.id) ?? 'hsl(var(--muted))'}
        data={treeData}
        enableParentLabel={false}
        identity="name"
        innerPadding={2}
        label={(node) => (node.data as { displayName?: string }).displayName ?? node.id}
        labelSkipSize={32}
        labelTextColor="hsl(var(--foreground))"
        margin={{ bottom: 2, left: 2, right: 2, top: 2 }}
        motionConfig="gentle"
        outerPadding={4}
        tile="squarify"
        value="value"
        valueFormat={(v) => fmt.format(v)}
        tooltip={({ node }) => {
          const d = node.data as { accountId?: number; currency?: string; displayName?: string; rawBalance?: number };
          if (!d.accountId) return null;
          const pct = total > 0 ? ((node.value / total) * 100).toFixed(1) : '0';
          const nativeFmt = new Intl.NumberFormat('en-US', {
            currency: d.currency ?? baseCurrency,
            maximumFractionDigits: d.currency === 'BTC' || d.currency === 'ETH' ? 6 : 2,
            style: 'currency',
          });
          return (
            <div className="rounded border bg-card px-2.5 py-2 shadow-md pointer-events-none min-w-[150px]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  aria-hidden
                  style={{ backgroundColor: colorMap.get(node.id) ?? '#888' }}
                  className="inline-block h-1.5 w-1.5 rounded-full flex-none"
                />
                <span className="text-xs font-medium text-foreground truncate">{d.displayName}</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xs font-mono text-muted-foreground uppercase">BAL</span>
                  <span className="text-2xs font-mono tabular-nums">{nativeFmt.format(Math.abs(d.rawBalance ?? 0))}</span>
                </div>
                {d.currency !== baseCurrency && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-2xs font-mono text-muted-foreground uppercase">≈{baseCurrency}</span>
                    <span className="text-2xs font-mono tabular-nums text-muted-foreground">{fmt.format(node.value)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-0.5 mt-0.5">
                  <span className="text-2xs font-mono text-muted-foreground uppercase">SHARE</span>
                  <span className="text-2xs font-mono tabular-nums">{pct}%</span>
                </div>
              </div>
            </div>
          );
        }}
        onClick={(node) => {
          const d = node.data as { accountId?: number };
          if (d.accountId && onNavigate) onNavigate(d.accountId);
        }}
      />
    </div>
  );
};

export default React.memo(AccountsTreemap);
