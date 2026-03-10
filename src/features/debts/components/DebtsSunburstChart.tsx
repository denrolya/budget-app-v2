import { ResponsiveSunburst } from '@nivo/sunburst';
import React, { useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { useBaseCurrency } from '@/features/auth';

import Debt from '../models/Debt';

export type SunburstNode = {
  name: string;
  value?: number;
  color?: string;
  debtId?: number;
  rawBalance?: number;
  isClosed?: boolean;
  currency?: string;
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
  debts: Debt[];
  onHoverChange?: (node: HoveredSunburstNode | null) => void;
}

// Open debts: vivid, perceptually distinct hues
const OPEN_PALETTE = [
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#f97316', // orange
  '#14b8a6', // teal
  '#ec4899', // pink
  '#84cc16', // lime
];

// Closed debts: desaturated slate tones
const CLOSED_PALETTE = [
  '#94a3b8', // slate-400
  '#9ca3af', // gray-400
  '#a1a1aa', // zinc-400
  '#a3a3a3', // neutral-400
  '#6b7280', // gray-500
];

const OPEN_RING_COLOR = '#6366f1';
const CLOSED_RING_COLOR = '#94a3b8';

const resolveColor = (isClosed: boolean, idx: number): string => {
  if (isClosed) return CLOSED_PALETTE[idx % CLOSED_PALETTE.length];
  return OPEN_PALETTE[idx % OPEN_PALETTE.length];
};

const DebtsSunburstChart: React.FC<Props> = ({ debts, onHoverChange }) => {
  const baseCurrency = useBaseCurrency();

  const sunburstData = useMemo<SunburstNode>(() => {
    const open = debts.filter((d) => !d.isClosed());
    const closed = debts.filter((d) => d.isClosed());

    const toNode = (d: Debt, idx: number): SunburstNode => ({
      name: d.debtor,
      value: Math.max(Math.abs(d.convertedValues?.[baseCurrency] ?? d.balance), 0.001),
      color: resolveColor(d.isClosed(), idx),
      debtId: d.id,
      rawBalance: d.balance,
      isClosed: d.isClosed(),
      currency: d.currency,
    });

    const children: SunburstNode[] = [];

    if (open.length > 0) {
      children.push({
        name: 'Open',
        color: OPEN_RING_COLOR,
        children: open.map((d, i) => toNode(d, i)),
      });
    }

    if (closed.length > 0) {
      children.push({
        name: 'Closed',
        color: CLOSED_RING_COLOR,
        children: closed.map((d, i) => toNode(d, i)),
      });
    }

    return { name: 'Debts', children };
  }, [debts, baseCurrency]);

  const DebtTooltip = ({ value, percentage, color, data }: HoveredSunburstNode) => {
    const isDebt = data.debtId !== undefined;
    const debt = isDebt ? debts.find((d) => d.id === data.debtId) ?? null : null;

    if (debt) {
      return (
        <div className="bg-background border rounded-lg shadow-lg overflow-hidden text-sm min-w-[190px]">
          <div className="px-3 pt-2.5 pb-2 flex items-center gap-2">
            <span style={{ backgroundColor: color }} className="h-2.5 w-2.5 rounded-sm flex-none" />
            <span className="font-semibold truncate">{debt.debtor}</span>
          </div>
          <div className="border-t px-3 py-2 space-y-1.5">
            <div className="flex justify-between items-center gap-6">
              <span className="text-xs text-muted-foreground">Balance</span>
              <MoneyValue
                amount={debt.balance}
                currency={debt.currency}
                useColors={false}
                values={debt.convertedValues}
                className="text-xs font-semibold"
              />
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="text-xs text-muted-foreground">Portfolio</span>
              <span className="text-xs font-semibold">{percentage.toFixed(1)}%</span>
            </div>
            {debt.isClosed() && (
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="text-xs text-muted-foreground">Closed</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Group node (Open / Closed)
    return (
      <div className="bg-background border rounded-lg shadow-lg px-3 py-2.5 text-sm min-w-[150px]">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ backgroundColor: color }} className="h-2.5 w-2.5 rounded-sm flex-none" />
          <span className="font-semibold">{data.name}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-6">
            <span className="text-xs text-muted-foreground">Total (approx.)</span>
            <MoneyValue amount={value} useColors={false} values={{}} className="text-xs font-semibold" />
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-xs text-muted-foreground">Share</span>
            <span className="text-xs font-semibold">{percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveSunburst<SunburstNode>
      animate
      isInteractive
      borderColor={{ theme: 'background' }}
      borderWidth={10}
      inheritColorFromParent={false}
      colors={(node) => (node.data as SunburstNode).color ?? OPEN_RING_COLOR}
      cornerRadius={3}
      data={sunburstData}
      enableArcLabels={false}
      id="name"
      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
      motionConfig="gentle"
      tooltip={DebtTooltip as any}
      transitionMode="pushIn"
      value="value"
      onMouseEnter={(datum) => onHoverChange?.(datum as HoveredSunburstNode)}
      onMouseLeave={() => onHoverChange?.(null)}
    />
  );
};

export default React.memo(DebtsSunburstChart);
