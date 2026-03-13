import { ResponsivePie } from '@nivo/pie';
import React, { useCallback, useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { useBaseCurrency } from '@/features/auth';

import type Debt from '../models/Debt';

// ── Exported types ────────────────────────────────────────────────────────────

export type HoveredSunburstNode = {
  id: string;
  value: number;
  depth: number;
  percentage: number;
  data: {
    name: string;
    color?: string;
    debtId?: number;
    rawBalance?: number;
    currency?: string;
  };
  color: string;
};

interface Props {
  debts: Debt[];
  onHoverChange?: (node: HoveredSunburstNode | null) => void;
  onNavigate?: (debtId: number) => void;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const PALETTE = [
  '#6366f1',
  '#f43f5e',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#a855f7',
  '#f97316',
  '#14b8a6',
  '#ec4899',
  '#84cc16',
];

// ── Datum type ────────────────────────────────────────────────────────────────

type PieDatum = {
  id: string;
  label: string;
  value: number;
  color: string;
  debtId: number;
  currency: string;
  rawBalance: number;
  convertedValue?: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

const DebtsSunburstChart: React.FC<Props> = ({ debts, onHoverChange, onNavigate }) => {
  const baseCurrency = useBaseCurrency();

  const { pieData, total } = useMemo(() => {
    const open = debts.filter((d) => !d.isClosed());
    const total = open.reduce((s, d) => s + Math.abs(d.convertedValues?.[baseCurrency] ?? d.balance), 0);

    const pieData: PieDatum[] = open.map((d, i) => ({
      id: d.id.toString(),
      label: d.debtor,
      value: Math.max(Math.abs(d.convertedValues?.[baseCurrency] ?? d.balance), 0.001),
      color: PALETTE[i % PALETTE.length],
      debtId: d.id,
      currency: d.currency,
      rawBalance: d.balance,
      convertedValue: d.convertedValues?.[baseCurrency],
    }));

    return { pieData, total };
  }, [debts, baseCurrency]);

  const handleMouseEnter = useCallback(
    (datum: { id: string; value: number; color: string; data: PieDatum }) => {
      const d = datum.data;
      onHoverChange?.({
        id: datum.id,
        value: datum.value,
        depth: 1,
        percentage: total > 0 ? (datum.value / total) * 100 : 0,
        color: datum.color,
        data: {
          name: d.label,
          color: datum.color,
          debtId: d.debtId,
          rawBalance: d.rawBalance,
          currency: d.currency,
        },
      });
    },
    [onHoverChange, total],
  );

  const handleMouseLeave = useCallback(() => {
    onHoverChange?.(null);
  }, [onHoverChange]);

  const handleClick = useCallback(
    (datum: { data: PieDatum }) => {
      onNavigate?.(datum.data.debtId);
    },
    [onNavigate],
  );

  const tooltip = useCallback(
    ({ datum }: { datum: { id: string | number; label: string; value: number; color: string; data: PieDatum } }) => {
      const d = datum.data;
      const debt = debts.find((x) => x.id === d.debtId);
      if (!debt) return null;
      const pct = total > 0 ? (datum.value / total) * 100 : 0;

      return (
        <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm min-w-[170px] pointer-events-none">
          <div className="flex items-center gap-2 mb-1.5">
            <span aria-hidden style={{ backgroundColor: datum.color }} className="inline-block h-2 w-2 rounded-full flex-none" />
            <span className="font-medium text-foreground truncate">{debt.debtor}</span>
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Balance</span>
              <MoneyValue
                amount={debt.balance}
                currency={debt.currency}
                useColors={false}
                values={debt.convertedValues}
                className="text-xs font-medium tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4 border-t pt-0.5 mt-0.5">
              <span className="text-muted-foreground">Share</span>
              <span className="tabular-nums">{pct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    },
    [debts, total],
  );

  if (pieData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No open debts</p>
      </div>
    );
  }

  return (
    <div style={{ cursor: onNavigate ? 'pointer' : 'default' }} className="h-full w-full">
      <ResponsivePie
        activeInnerRadiusOffset={6}
        activeOuterRadiusOffset={8}
        animate={true}
        arcLabelsSkipAngle={20}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        arcLinkLabelsSkipAngle={12}
        borderWidth={0}
        colors={{ datum: 'data.color' }}
        cornerRadius={4}
        data={pieData}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        innerRadius={0.55}
        motionConfig="gentle"
        padAngle={1.2}
        tooltip={tooltip as unknown as Parameters<typeof ResponsivePie>[0]['tooltip']}
        onClick={handleClick as unknown as Parameters<typeof ResponsivePie>[0]['onClick']}
        onMouseEnter={handleMouseEnter as unknown as Parameters<typeof ResponsivePie>[0]['onMouseEnter']}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default React.memo(DebtsSunburstChart);
