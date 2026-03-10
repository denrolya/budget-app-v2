import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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

// ── Internal datum types ───────────────────────────────────────────────────────

type GroupDatum = {
  id: string;
  name: string;
  value: number;
  color: string;
  percentage: number;
};

type DebtDatum = {
  id: number;
  name: string;
  value: number;
  color: string;
  currency: string;
  rawBalance: number;
  isClosed: boolean;
  percentage: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

const DebtsSunburstChart: React.FC<Props> = ({ debts, onHoverChange }) => {
  const baseCurrency = useBaseCurrency();

  // ── Build ring & leaf data ─────────────────────────────────────────────────

  const { innerData, outerData } = useMemo(() => {
    const open = debts.filter((d) => !d.isClosed());
    const closed = debts.filter((d) => d.isClosed());

    const total = debts.reduce(
      (s, d) => s + Math.abs(d.convertedValues?.[baseCurrency] ?? d.balance),
      0,
    );

    const toDebtDatum = (d: Debt, idx: number, isClosedDebt: boolean): DebtDatum => {
      const v = Math.max(Math.abs(d.convertedValues?.[baseCurrency] ?? d.balance), 0.001);
      const palette = isClosedDebt ? CLOSED_PALETTE : OPEN_PALETTE;
      return {
        id: d.id,
        name: d.debtor,
        value: v,
        color: palette[idx % palette.length],
        currency: d.currency,
        rawBalance: d.balance,
        isClosed: isClosedDebt,
        percentage: total > 0 ? (v / total) * 100 : 0,
      };
    };

    const openTotal = open.reduce(
      (s, d) => s + Math.abs(d.convertedValues?.[baseCurrency] ?? d.balance),
      0,
    );
    const closedTotal = closed.reduce(
      (s, d) => s + Math.abs(d.convertedValues?.[baseCurrency] ?? d.balance),
      0,
    );

    const inner: GroupDatum[] = [];
    const outer: DebtDatum[] = [];

    if (open.length > 0) {
      inner.push({
        id: 'open',
        name: 'Open',
        value: openTotal,
        color: OPEN_RING_COLOR,
        percentage: total > 0 ? (openTotal / total) * 100 : 0,
      });
      outer.push(...open.map((d, i) => toDebtDatum(d, i, false)));
    }

    if (closed.length > 0) {
      inner.push({
        id: 'closed',
        name: 'Closed',
        value: closedTotal,
        color: CLOSED_RING_COLOR,
        percentage: total > 0 ? (closedTotal / total) * 100 : 0,
      });
      outer.push(...closed.map((d, i) => toDebtDatum(d, i, true)));
    }

    return { innerData: inner, outerData: outer };
  }, [debts, baseCurrency]);

  // ── Hover callbacks ────────────────────────────────────────────────────────

  const handleGroupEnter = (data: GroupDatum) => {
    onHoverChange?.({
      id: data.id,
      value: data.value,
      depth: 1,
      percentage: data.percentage,
      color: data.color,
      data: { name: data.name, color: data.color },
    });
  };

  const handleDebtEnter = (data: DebtDatum) => {
    onHoverChange?.({
      id: String(data.id),
      value: data.value,
      depth: 2,
      percentage: data.percentage,
      color: data.color,
      data: {
        name: data.name,
        color: data.color,
        currency: data.currency,
        debtId: data.id,
        rawBalance: data.rawBalance,
        isClosed: data.isClosed,
      },
    });
  };

  const handleLeave = () => onHoverChange?.(null);

  // ── Tooltip ────────────────────────────────────────────────────────────────

  const renderTooltip = useMemo(
    () =>
      (props: any) => {
        if (!props.active || !props.payload?.[0]) return null;
        const entry = props.payload[0].payload as GroupDatum | DebtDatum;
        const isDebt = 'rawBalance' in entry;

        if (isDebt) {
          const d = entry as DebtDatum;
          const debt = debts.find((x) => x.id === d.id) ?? null;
          if (!debt) return null;
          return (
            <div className="bg-background border rounded-lg shadow-lg overflow-hidden text-sm min-w-[190px]">
              <div className="px-3 pt-2.5 pb-2 flex items-center gap-2">
                <span style={{ backgroundColor: d.color }} className="h-2.5 w-2.5 rounded-sm flex-none" />
                <span className="font-semibold truncate">{debt.debtor}</span>
                {d.isClosed && (
                  <span className="ml-auto text-[10px] text-muted-foreground border rounded px-1 py-0.5 flex-none">
                    Closed
                  </span>
                )}
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
                  <span className="text-xs font-semibold">{d.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        }

        const g = entry as GroupDatum;
        return (
          <div className="bg-background border rounded-lg shadow-lg px-3 py-2.5 text-sm min-w-[150px]">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ backgroundColor: g.color }} className="h-2.5 w-2.5 rounded-sm flex-none" />
              <span className="font-semibold">{g.name}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs text-muted-foreground">Total (approx.)</span>
                <MoneyValue amount={g.value} useColors={false} values={{}} className="text-xs font-semibold" />
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs text-muted-foreground">Share</span>
                <span className="text-xs font-semibold">{g.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      },
    [debts],
  );

  return (
    <div className="h-full w-full" onPointerLeave={handleLeave}>
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          {/* Inner ring — Open / Closed groups */}
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
            paddingAngle={4}
            startAngle={90}
            onMouseEnter={(data) => handleGroupEnter(data as unknown as GroupDatum)}
          >
            {innerData.map((entry) => (
              <Cell fill={entry.color} stroke="none" key={`group-${entry.id}`} />
            ))}
          </Pie>
          {/* Outer ring — individual debts */}
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
            onMouseEnter={(data) => handleDebtEnter(data as unknown as DebtDatum)}
          >
            {outerData.map((entry) => (
              <Cell fill={entry.color} stroke="none" key={`debt-${entry.id}`} />
            ))}
          </Pie>
          <Tooltip content={renderTooltip} isAnimationActive={false} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(DebtsSunburstChart);
