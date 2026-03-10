import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import MoneyValue from '@/components/common/MoneyValue';
import { CURRENCIES } from '@/constants/currency';
import { useBaseCurrency } from '@/features/auth';
import { useActiveAccounts } from '@/hooks/financeData';

import AccountPill from './Pill';

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

// ── Internal datum types ──────────────────────────────────────────────────────

type RingDatum = {
  id: string;
  name: string;
  value: number;
  color: string;
  currency: string;
  percentage: number;
};

type LeafDatum = {
  id: number;
  name: string;
  value: number;
  color: string;
  currency: string;
  rawBalance: number;
  convertedValue?: number;
  percentage: number;
};

// ── Color helpers ─────────────────────────────────────────────────────────────

const resolveCssColor = (cssValue: string): string => {
  if (typeof window === 'undefined') return '#888';
  if (!cssValue.startsWith('var(')) return cssValue;
  const varName = cssValue.replace(/^var\(/, '').replace(/\)$/, '').trim();
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#888';
};

const getCurrencyColor = (currency: string): string => resolveCssColor(`var(--account-bank-${currency})`);

const AccountsSunburstChart: React.FC<Props> = ({ onHoverChange }) => {
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();

  // ── Build ring & leaf data ─────────────────────────────────────────────────

  const { innerData, outerData } = useMemo(() => {
    const total = accounts.reduce(
      (s, acc) => s + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0),
      0,
    );

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

    // Sort currencies by total descending so inner + outer rings align visually
    const sortedCurrencies = [...grouped.entries()].sort(
      ([a], [b]) => (groupTotal.get(b) ?? 0) - (groupTotal.get(a) ?? 0),
    );

    const inner: RingDatum[] = [];
    const outer: LeafDatum[] = [];

    for (const [currency, accs] of sortedCurrencies) {
      const gt = groupTotal.get(currency) ?? 0;
      const color = getCurrencyColor(currency);
      const info = CURRENCIES[currency as keyof typeof CURRENCIES];
      inner.push({
        id: currency,
        name: info ? `${info.symbol} ${currency}` : currency,
        value: gt,
        color,
        currency,
        percentage: total > 0 ? (gt / total) * 100 : 0,
      });

      const sorted = accs
        .slice()
        .sort(
          (a, b) =>
            Math.abs(b.convertedValues?.[baseCurrency] ?? b.balance) -
            Math.abs(a.convertedValues?.[baseCurrency] ?? a.balance),
        );

      for (const acc of sorted) {
        const cv = acc.convertedValues?.[baseCurrency];
        const v = Math.max(Math.abs(cv ?? acc.balance), 0.001);
        outer.push({
          id: acc.id,
          name: acc.name,
          value: v,
          color: resolveCssColor(acc.color),
          currency: acc.currency,
          rawBalance: acc.balance,
          convertedValue: cv,
          percentage: total > 0 ? (v / total) * 100 : 0,
        });
      }
    }

    return { innerData: inner, outerData: outer };
  }, [accounts, baseCurrency]);

  // ── Hover callbacks ────────────────────────────────────────────────────────

  const handleRingEnter = (data: RingDatum) => {
    onHoverChange?.({
      id: data.id,
      value: data.value,
      depth: 1,
      percentage: data.percentage,
      color: data.color,
      data: { name: data.name, color: data.color, currency: data.currency },
    });
  };

  const handleLeafEnter = (data: LeafDatum) => {
    onHoverChange?.({
      id: String(data.id),
      value: Math.abs(data.rawBalance),
      depth: 2,
      percentage: data.percentage,
      color: data.color,
      data: {
        name: data.name,
        color: data.color,
        currency: data.currency,
        accountId: data.id,
        rawBalance: data.rawBalance,
        convertedValue: data.convertedValue,
      },
    });
  };

  const handleLeave = () => onHoverChange?.(null);

  // ── Tooltip ────────────────────────────────────────────────────────────────

  const renderTooltip = useMemo(
    () =>
      (props: any) => {
        if (!props.active || !props.payload?.[0]) return null;
        const entry = props.payload[0].payload as RingDatum | LeafDatum;
        const isLeaf = 'rawBalance' in entry;

        if (isLeaf) {
          const leaf = entry as LeafDatum;
          const acc = accounts.find((a) => a.id === leaf.id) ?? null;
          if (!acc) return null;
          return (
            <div className="bg-background border rounded-lg shadow-lg overflow-hidden text-sm min-w-[190px]">
              <div className="px-3 pt-3 pb-2">
                <AccountPill showName account={acc} size="sm" tone="subtle" tooltip={false} variant="pill" />
              </div>
              <div className="border-t px-3 py-2 space-y-1.5">
                <div className="flex justify-between items-center gap-6">
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <MoneyValue
                    useColors
                    amount={acc.balance}
                    currency={acc.currency}
                    values={{}}
                    className="text-xs font-semibold"
                  />
                </div>
                {leaf.convertedValue !== undefined && acc.currency !== baseCurrency && (
                  <div className="flex justify-between items-center gap-6">
                    <span className="text-xs text-muted-foreground">≈ {baseCurrency}</span>
                    <span className="text-xs font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: baseCurrency,
                        maximumFractionDigits: 0,
                      }).format(Math.abs(leaf.convertedValue))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center gap-6">
                  <span className="text-xs text-muted-foreground">Portfolio</span>
                  <span className="text-xs font-semibold">{leaf.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        }

        const ring = entry as RingDatum;
        return (
          <div className="bg-background border rounded-lg shadow-lg px-3 py-2.5 text-sm min-w-[160px]">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ backgroundColor: ring.color }} className="h-2.5 w-2.5 rounded-sm flex-none" />
              <span className="font-semibold">{ring.name}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-xs font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: baseCurrency,
                    maximumFractionDigits: 0,
                  }).format(ring.value)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs text-muted-foreground">Portfolio</span>
                <span className="text-xs font-semibold">{ring.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      },
    [accounts, baseCurrency],
  );

  return (
    <div className="h-full w-full" onPointerLeave={handleLeave}>
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          {/* Inner ring — currency groups */}
          <Pie
            isAnimationActive
            animationBegin={0}
            animationDuration={550}
            animationEasing="ease-out"
            cx="50%"
            cy="50%"
            data={innerData}
            dataKey="value"
            endAngle={-270}
            innerRadius="30%"
            outerRadius="49%"
            paddingAngle={3}
            startAngle={90}
            onMouseEnter={(data) => handleRingEnter(data as unknown as RingDatum)}
          >
            {innerData.map((entry) => (
              <Cell fill={entry.color} stroke="none" key={`ring-${entry.id}`} />
            ))}
          </Pie>
          {/* Outer ring — individual accounts */}
          <Pie
            isAnimationActive
            animationBegin={200}
            animationDuration={550}
            animationEasing="ease-out"
            cx="50%"
            cy="50%"
            data={outerData}
            dataKey="value"
            endAngle={-270}
            innerRadius="52%"
            outerRadius="70%"
            paddingAngle={2}
            startAngle={90}
            onMouseEnter={(data) => handleLeafEnter(data as unknown as LeafDatum)}
          >
            {outerData.map((entry) => (
              <Cell fill={entry.color} stroke="none" key={`leaf-${entry.id}`} />
            ))}
          </Pie>
          <Tooltip content={renderTooltip} isAnimationActive={false} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(AccountsSunburstChart);
