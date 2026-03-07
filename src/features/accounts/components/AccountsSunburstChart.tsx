import { ResponsiveSunburst } from '@nivo/sunburst';
import React, { useMemo } from 'react';

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
  accountId?: number;       // set on account leaves for tooltip lookup
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

// Resolve CSS custom property at runtime — Nivo SVG renderer needs a real color string
function resolveCssVar(varName: string): string {
  if (typeof window === 'undefined') return '#888';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#888';
}

function getCurrencyBaseColor(currency: string): string {
  return resolveCssVar(`--account-bank-${currency}`);
}

const AccountsSunburstChart: React.FC<Props> = ({ onHoverChange }) => {
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();

  const sunburstData = useMemo<SunburstNode>(() => {
    const grouped = new Map<string, typeof accounts>();
    for (const acc of accounts) {
      const bucket = grouped.get(acc.currency) ?? [];
      bucket.push(acc);
      grouped.set(acc.currency, bucket);
    }

    const children: SunburstNode[] = [];
    for (const [currency, accs] of grouped) {
      const ringColor = getCurrencyBaseColor(currency);
      const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES];

      children.push({
        name: currencyInfo ? `${currencyInfo.symbol} ${currency}` : currency,
        color: ringColor,
        currency,
        children: accs.map((acc) => {
          const converted = acc.convertedValues?.[baseCurrency];
          return {
            name: acc.name,
            value: Math.max(Math.abs(converted ?? acc.balance), 0.001),
            color: ringColor,       // explicit fallback so arcs are never black
            currency: acc.currency,
            accountId: acc.id,      // for tooltip lookup
            rawBalance: acc.balance,
            convertedValue: converted,
          };
        }),
      });
    }

    return { name: 'Accounts', children };
  }, [accounts, baseCurrency]);

  // ── Custom tooltip ─────────────────────────────────────────────────────────
  // Defined inside the component so it has access to accounts / baseCurrency
  function SunburstTooltip({ value, percentage, color, data }: HoveredSunburstNode) {
    const node = data;
    const isAccount = node.rawBalance !== undefined;
    const account =
      isAccount && node.accountId !== undefined
        ? (accounts.find((a) => a.id === node.accountId) ?? null)
        : null;

    if (account) {
      return (
        <div className="bg-background border rounded-lg shadow-lg overflow-hidden text-sm min-w-[190px]">
          <div className="px-3 pt-3 pb-2">
            <AccountPill account={account} showName variant="pill" tone="subtle" size="sm" tooltip={false} />
          </div>
          <div className="border-t px-3 py-2 space-y-1.5">
            <div className="flex justify-between items-center gap-6">
              <span className="text-xs text-muted-foreground">Balance</span>
              <MoneyValue
                amount={account.balance}
                currency={account.currency}
                useColors
                values={{}}
                className="text-xs font-semibold"
              />
            </div>
            {node.convertedValue !== undefined && account.currency !== baseCurrency && (
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs text-muted-foreground">≈ {baseCurrency}</span>
                <span className="text-xs font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: baseCurrency,
                    maximumFractionDigits: 0,
                  }).format(Math.abs(node.convertedValue))}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center gap-6">
              <span className="text-xs text-muted-foreground">Portfolio</span>
              <span className="text-xs font-semibold">{percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }

    // Currency ring tooltip
    return (
      <div className="bg-background border rounded-lg shadow-lg px-3 py-2.5 text-sm min-w-[160px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2.5 w-2.5 rounded-sm flex-none" style={{ backgroundColor: color }} />
          <span className="font-semibold">{node.name}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-6">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xs font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: baseCurrency,
                maximumFractionDigits: 0,
              }).format(value)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-xs text-muted-foreground">Portfolio</span>
            <span className="text-xs font-semibold">{percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveSunburst<SunburstNode>
      data={sunburstData}
      id="name"
      value="value"
      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
      cornerRadius={3}
      borderWidth={6}
      borderColor={{ theme: 'background' }}
      // Use a function so both ring nodes and account nodes get their currency colour
      colors={(node) => {
        const d = node.data as SunburstNode;
        if (d.currency) return getCurrencyBaseColor(d.currency);
        return '#888';
      }}
      childColor={{ from: 'color', modifiers: [['brighter', 0.35]] }}
      enableArcLabels={false}
      isInteractive
      animate={true}
      motionConfig="gentle"
      transitionMode="pushIn"
      onMouseEnter={(datum) => onHoverChange?.(datum as HoveredSunburstNode)}
      onMouseLeave={() => onHoverChange?.(null)}
      tooltip={SunburstTooltip as any}
    />
  );
};

// Memo prevents re-renders when the parent's hover state changes,
// which stops nivo from re-running its entry animation on every hover event.
export default React.memo(AccountsSunburstChart);
