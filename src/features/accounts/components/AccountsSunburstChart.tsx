import { ResponsiveRadialBar } from '@nivo/radial-bar';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useBaseCurrency } from '@/features/auth';
import { useActiveAccounts } from '@/hooks/financeData';

// ── Exported types (unchanged – AccountsIndexPage depends on these) ───────────

export type SunburstNode = {
  name: string;
  value?: number;
  color?: string;
  currency?: string;
  accountId?: number;
  rawBalance?: number;
  convertedValue?: number;
  children?: SunburstNode[];
};

export type HoveredSunburstNode = {
  id: string;
  value: number;
  depth: number;
  percentage: number;
  data: SunburstNode;
  color: string;
};

interface Props {
  onHoverChange?: (node: HoveredSunburstNode | null) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const resolveCssColor = (cssValue: string): string => {
  if (typeof window === 'undefined') return '#888';
  if (!cssValue.startsWith('var(')) return cssValue;
  const varName = cssValue
    .replace(/^var\(/, '')
    .replace(/\)$/, '')
    .trim();
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#888';
};

// ── HoverBridge ───────────────────────────────────────────────────────────────
// Module-level stable component — Nivo renders this as the tooltip.
// Having barId in useEffect deps means it fires whenever the hovered bar changes,
// even when Nivo re-renders the same component instance (no unmount/remount needed).

type Account = ReturnType<typeof useActiveAccounts>[0];

interface HoverBridgeProps {
  barId: string;
  accountMap: Map<string, Account>;
  baseCurrency: string;
  total: number;
  onHoverChangeRef: React.MutableRefObject<((node: HoveredSunburstNode | null) => void) | undefined>;
}

const HoverBridge: React.FC<HoverBridgeProps> = ({ barId, accountMap, baseCurrency, total, onHoverChangeRef }) => {
  useEffect(() => {
    const acc = accountMap.get(barId);
    if (!acc) return;
    const cv = acc.convertedValues?.[baseCurrency];
    const v = Math.abs(cv ?? acc.balance);
    const color = resolveCssColor(acc.color);
    onHoverChangeRef.current?.({
      id: barId,
      value: Math.abs(acc.balance),
      depth: 2,
      percentage: total > 0 ? (v / total) * 100 : 0,
      color,
      data: {
        name: acc.name,
        color,
        currency: acc.currency,
        accountId: acc.id,
        rawBalance: acc.balance,
        convertedValue: cv,
      },
    });
    return () => {
      onHoverChangeRef.current?.(null);
    };
    // barId changing means a different bar is hovered — re-fire
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barId, accountMap, baseCurrency, total]);
  return null;
};

// ── Component ─────────────────────────────────────────────────────────────────

const AccountsSunburstChart: React.FC<Props> = ({ onHoverChange }) => {
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();

  const { nivoData, accountMap, total } = useMemo(() => {
    const total = accounts.reduce((s, acc) => s + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0);

    const grouped = new Map<string, typeof accounts>();
    const groupTotal = new Map<string, number>();

    for (const acc of accounts) {
      const bucket = grouped.get(acc.currency) ?? [];
      bucket.push(acc);
      grouped.set(acc.currency, bucket);
      groupTotal.set(
        acc.currency,
        (groupTotal.get(acc.currency) ?? 0) + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0),
      );
    }

    // Largest currency → outermost ring (rendered last by Nivo)
    const sortedCurrencies = [...grouped.entries()].sort(
      ([a], [b]) => (groupTotal.get(b) ?? 0) - (groupTotal.get(a) ?? 0),
    );

    // Map from bar x-key (account ID string) to account object for hover lookup
    const accountMap = new Map<string, (typeof accounts)[0]>();

    const nivoData = sortedCurrencies.map(([currency, accs]) => {
      const sorted = accs
        .slice()
        .sort(
          (a, b) =>
            Math.abs(b.convertedValues?.[baseCurrency] ?? b.balance) -
            Math.abs(a.convertedValues?.[baseCurrency] ?? a.balance),
        );

      for (const acc of sorted) {
        accountMap.set(acc.id.toString(), acc);
      }

      return {
        id: currency,
        data: sorted.map((acc) => ({
          x: acc.id.toString(),
          y: Math.max(Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0.001),
        })),
      };
    });

    return { nivoData, accountMap, total };
  }, [accounts, baseCurrency]);

  // Ref-stable callback so HoverBridge doesn't capture stale onHoverChange
  const onHoverChangeRef = useRef(onHoverChange);
  useEffect(() => {
    onHoverChangeRef.current = onHoverChange;
  });

  // Stable tooltip function — Nivo calls this with the hovered bar data.
  // We pass all needed values as props so HoverBridge can react to barId changes.
  const tooltipFn = useCallback(
    (bar: { id: string | number; groupId: string; color: string }) => (
      <HoverBridge
        accountMap={accountMap}
        barId={bar.id as string}
        baseCurrency={baseCurrency}
        total={total}
        onHoverChangeRef={onHoverChangeRef}
      />
    ),
    [accountMap, baseCurrency, total],
  );

  return (
    <div className="h-full w-full">
      <ResponsiveRadialBar
        cornerRadius={2}
        data={nivoData}
        enableCircularGrid={false}
        enableLabels={false}
        enableRadialGrid={false}
        enableTracks={true}
        endAngle={360}
        innerRadius={0.2}
        isInteractive={true}
        maxValue={total || 1}
        motionConfig="gentle"
        padAngle={0.8}
        padding={0.35}
        tooltip={tooltipFn as any}
        tracksColor="hsl(var(--muted))"
        colors={(bar) => {
          const acc = accountMap.get(bar.id as string);
          if (acc) return resolveCssColor(acc.color);
          return resolveCssColor(`var(--account-bank-${bar.groupId})`);
        }}
      />
    </div>
  );
};

export default React.memo(AccountsSunburstChart);
