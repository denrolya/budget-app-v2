import { linearGradientDef } from '@nivo/core';
import { ResponsiveLine, type SliceTooltipProps } from '@nivo/line';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { type Transaction } from '@/features/transactions';
import { Type as TransactionType } from '@/features/transactions/types';

interface Props {
  currency: string;
  currentBalance: number;
  transactions: Transaction[];
}

const PRESETS = [
  { label: 'All', months: null },
  { label: '1Y', months: 12 },
  { label: '6M', months: 6 },
] as const;

type PresetLabel = (typeof PRESETS)[number]['label'];

const CHART_HEIGHT = 180;
const GRADIENT_ID = 'debtBalanceGradient';

const nivoTheme = {
  background: 'transparent',
  text: {
    fill: 'hsl(var(--muted-foreground))',
    fontSize: 11,
  },
  grid: {
    line: {
      stroke: 'hsl(var(--border))',
      strokeWidth: 1,
    },
  },
  axis: {
    ticks: {
      line: { stroke: 'transparent' },
      text: {
        fill: 'hsl(var(--muted-foreground))',
        fontSize: 11,
      },
    },
    domain: {
      line: { stroke: 'transparent' },
    },
  },
  crosshair: {
    line: {
      stroke: 'hsl(var(--muted-foreground))',
      strokeWidth: 1,
      strokeOpacity: 0.4,
    },
  },
};

const DebtBalanceChart: React.FC<Props> = ({ currency, currentBalance, transactions }) => {
  const [preset, setPreset] = useState<PresetLabel>('All');

  // Sorted transactions (oldest first) within the selected preset window
  const filteredTransactions = useMemo(() => {
    const selected = PRESETS.find((p) => p.label === preset)!;
    const cutoff = selected.months ? moment().subtract(selected.months, 'months').startOf('day') : null;
    return [...transactions]
      .filter((tx) => !cutoff || tx.executedAt.isSameOrAfter(cutoff))
      .sort((a, b) => a.executedAt.valueOf() - b.executedAt.valueOf());
  }, [transactions, preset]);

  // Build the running-balance series
  const { chartData, lineColor } = useMemo(() => {
    // Compute starting balance by reversing all transactions from currentBalance
    // (income added to balance, expense subtracted → reverse: income subtract, expense add)
    const allSorted = [...transactions].sort((a, b) => a.executedAt.valueOf() - b.executedAt.valueOf());

    // Determine which transactions are *after* our window (not in filteredTransactions)
    const filteredIds = new Set(filteredTransactions.map((tx) => tx.id));
    const priorTransactions = allSorted.filter((tx) => !filteredIds.has(tx.id));

    // Starting balance = currentBalance adjusted backwards for transactions outside the window
    let startBalance = currentBalance;
    for (const tx of priorTransactions) {
      const amount = (tx.convertedValues as Record<string, number>)[currency] ?? tx.amount;
      if (tx.type === TransactionType.Income) {
        startBalance -= amount; // reverse the income (lending — it grew the balance)
      } else {
        startBalance += amount; // reverse the expense (repayment — it shrank the balance)
      }
    }

    // Build running balance points
    const points: Array<{ x: string; y: number }> = [];
    let balance = startBalance;
    for (const tx of filteredTransactions) {
      const amount = (tx.convertedValues as Record<string, number>)[currency] ?? tx.amount;
      if (tx.type === TransactionType.Income) {
        balance += amount;
      } else {
        balance -= amount;
      }
      points.push({ x: tx.executedAt.format('YYYY-MM-DD'), y: balance });
    }

    // Prepend a "start" point so the chart doesn't start in mid-air
    if (points.length > 0) {
      const firstDate = moment(points[0].x, 'YYYY-MM-DD').subtract(1, 'day').format('YYYY-MM-DD');
      points.unshift({ x: firstDate, y: startBalance });
    }

    const lastY = points[points.length - 1]?.y ?? 0;
    const color = `hsl(var(${lastY >= 0 ? '--success' : '--destructive'}))`;

    return {
      chartData: [{ id: 'balance', data: points }],
      lineColor: color,
    };
  }, [filteredTransactions, transactions, currentBalance, currency]);

  const gradientDef = useMemo(
    () =>
      linearGradientDef(
        GRADIENT_ID,
        [
          { offset: 0, color: lineColor, opacity: 0.3 },
          { offset: 100, color: lineColor, opacity: 0.02 },
        ],
        { x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
      ),
    [lineColor],
  );

  const SliceTooltip = ({ slice }: SliceTooltipProps) => {
    const point = slice.points[0];
    if (!point) return null;
    const balance = point.data.y as number;
    return (
      <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm">
        <p className="text-muted-foreground mb-1">
          {moment(point.data.x as string, 'YYYY-MM-DD').format('D MMM YYYY')}
        </p>
        <MoneyValue showSign useColors amount={balance} currency={currency as any} className="font-semibold text-sm" />
      </div>
    );
  };

  const hasData = chartData[0].data.length >= 2;

  const tickValues = useMemo(() => {
    const points = chartData[0].data;
    if (points.length <= 8) return undefined;
    const step = Math.ceil(points.length / 6);
    return points.filter((_, i) => i === 0 || i === points.length - 1 || i % step === 0).map((p) => p.x);
  }, [chartData]);

  return (
    <div className="relative">
      {/* Preset toggle — floats over top-right of the chart */}
      <div className="absolute top-2 right-3 z-10">
        <ToggleGroup size="sm" type="single" value={preset} onValueChange={(v) => v && setPreset(v as PresetLabel)}>
          {PRESETS.map((p) => (
            <ToggleGroupItem value={p.label} className="text-xs px-2" key={p.label}>
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {!hasData && (
        <div style={{ height: CHART_HEIGHT }} className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data for this period.</p>
        </div>
      )}

      {hasData && (
        <div style={{ height: CHART_HEIGHT }}>
          <ResponsiveLine
            animate={false}
            areaOpacity={1}
            axisLeft={null}
            axisRight={null}
            axisTop={null}
            colors={[lineColor]}
            crosshairType="x"
            curve="natural"
            data={chartData}
            defs={[gradientDef]}
            enableArea={true}
            enableGridX={false}
            enableGridY={false}
            enablePoints={false}
            enableSlices="x"
            fill={[{ match: '*', id: GRADIENT_ID }]}
            isInteractive={true}
            lineWidth={1.5}
            margin={{ top: 40, right: 0, bottom: 22, left: 0 }}
            sliceTooltip={SliceTooltip}
            theme={nivoTheme}
            xScale={{ type: 'point' }}
            yScale={{ max: 'auto', min: 'auto', stacked: false, type: 'linear' }}
            axisBottom={{
              format: (v: string) => moment(v, 'YYYY-MM-DD').format('D MMM'),
              tickPadding: 5,
              tickSize: 0,
              tickValues,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(DebtBalanceChart);
