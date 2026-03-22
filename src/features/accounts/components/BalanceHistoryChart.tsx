import { linearGradientDef } from '@nivo/core';
import { ResponsiveLine, type SliceTooltipProps } from '@nivo/line';
import moment from 'moment';
import React, { useMemo, useState, useCallback, useEffect } from 'react';

import { useBalanceHistory } from '@/features/accounts/api';
import type { BalanceHistoryPoint } from '@/features/accounts/api/service';
import type Account from '@/features/accounts/models/Account';

const EMPTY_POINTS: BalanceHistoryPoint[] = [];

export const PRESETS = [
  { label: '1M', months: 1, interval: 'P1D' },
  { label: '3M', months: 3, interval: 'P1D' }, // daily for smooth curve
  { label: '6M', months: 6, interval: 'P2D' }, // bi-daily → ~90 pts
  { label: '1Y', months: 12, interval: 'P1W' }, // weekly → ~52 pts
] as const;

export type PresetLabel = (typeof PRESETS)[number]['label'];

interface Props {
  account: Account;
  preset?: PresetLabel;
}

const CHART_HEIGHT = 140;

const GRADIENT_ID = 'balanceGradient';

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
  // No crosshair entry — replaced by CandleLayer
};

// ─── Candle indicator (roman candle hover effect) ─────────────────────────────

interface CandleState {
  x: string;
  y: number;
}

// Rendered as a Nivo custom layer — gets xScale/yScale from Nivo's context.
// Recreated via useMemo when candle or lineColor changes.
interface NivoLayerProps {
  xScale: (value: string) => number | undefined;
  yScale: (value: number) => number | undefined;
  innerHeight: number;
}

const buildCandleLayer = (candle: CandleState | null, lineColor: string) =>
  function CandleIndicator({ xScale, yScale, innerHeight }: NivoLayerProps) {
    if (!candle) return null;

    const sx: number | undefined = xScale(candle.x);
    const sy: number | undefined = yScale(candle.y);
    if (sx == null || sy == null) return null;

    return (
      <g>
        {/* Wick: dashed line from just below the dot down to the x-axis */}
        <line
          stroke={lineColor}
          strokeDasharray="3 2"
          strokeOpacity={0.3}
          strokeWidth={1}
          x1={sx}
          x2={sx}
          y1={sy + 7}
          y2={innerHeight}
        />
        {/* Outer glow ring */}
        <circle cx={sx} cy={sy} fill={lineColor} fillOpacity={0.12} r={11} />
        {/* Solid dot head */}
        <circle cx={sx} cy={sy} fill={lineColor} r={4.5} stroke="hsl(var(--background))" strokeWidth={2} />
      </g>
    );
  };

// ─── Inline x-axis layer (renders tick labels inside the chart, no bottom margin) ─

const buildInlineAxisLayer = (ticks: string[], format: (v: string) => string) =>
  function InlineAxisLayer({ xScale, innerHeight }: NivoLayerProps) {
    return (
      <g>
        {ticks.map((v) => {
          const x = xScale(v);
          if (x == null) return null;
          return (
            <text
              dominantBaseline="auto"
              fill="hsl(var(--muted-foreground))"
              fontSize={11}
              textAnchor="middle"
              x={x}
              y={innerHeight - 4}
              key={v}
            >
              {format(v)}
            </text>
          );
        })}
      </g>
    );
  };

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface PointTooltipProps extends SliceTooltipProps {
  onCandleChange: (c: CandleState | null) => void;
  currency: string;
  lineColor: string;
}

const PointTooltip: React.FC<PointTooltipProps> = ({ slice, onCandleChange, currency, lineColor }) => {
  const point = slice.points[0] ?? null;
  const pointX = (point?.data?.x ?? null) as string | null;
  const pointY = (point?.data?.y ?? null) as number | null;

  useEffect(() => {
    if (pointX !== null && pointY !== null) {
      onCandleChange({ x: pointX, y: pointY });
    }
  }, [pointX, pointY, onCandleChange]);

  if (!point || pointX === null || pointY === null) return null;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pointY);

  const isPositive = pointY >= 0;

  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm min-w-[120px]">
      <p className="text-muted-foreground text-xs mb-0.5">{moment(pointX, 'YYYY-MM-DD').format('D MMM YYYY')}</p>
      <p style={{ color: isPositive ? lineColor : 'hsl(var(--destructive))' }} className="font-semibold tabular-nums">
        {formatted}
      </p>
    </div>
  );
};

// ─── Chart ────────────────────────────────────────────────────────────────────

const BalanceHistoryChart: React.FC<Props> = ({ account, preset = '3M' }) => {
  const [candle, setCandle] = useState<CandleState | null>(null);
  const selected = PRESETS.find((p) => p.label === preset)!;

  const { after, before } = useMemo(
    () => ({
      before: moment().endOf('day'),
      after: moment().subtract(selected.months, 'months').startOf('day'),
    }),
    [selected.months],
  );

  const { data, isLoading, isError } = useBalanceHistory(account.id, after, before, selected.interval);

  const rawPoints = data?.data ?? EMPTY_POINTS;
  const lastBalance = rawPoints[rawPoints.length - 1]?.balance ?? 0;
  const lineColor = `hsl(var(${lastBalance >= 0 ? '--success' : '--destructive'}))`;

  const chartData = useMemo(
    () => [
      {
        id: 'balance',
        data: rawPoints.map((p) => ({
          x: moment.unix(p.timestamp).format('YYYY-MM-DD'),
          y: p.balance,
        })),
      },
    ],
    [rawPoints],
  );

  // ~6 evenly-spaced tick labels, always an array (used by custom inline axis layer)
  const tickValues = useMemo((): string[] => {
    if (rawPoints.length === 0) return [];
    if (rawPoints.length <= 6) return rawPoints.map((p) => moment.unix(p.timestamp).format('YYYY-MM-DD'));
    const step = Math.ceil(rawPoints.length / 6);
    return rawPoints
      .filter((_, i) => i === 0 || i === rawPoints.length - 1 || i % step === 0)
      .map((p) => moment.unix(p.timestamp).format('YYYY-MM-DD'));
  }, [rawPoints]);

  const formatXTick = useCallback(
    (value: string) => {
      const d = moment(value, 'YYYY-MM-DD');
      return selected.months === 12 ? d.format('MMM') : d.format('D MMM');
    },
    [selected.months],
  );

  const gradientDef = useMemo(
    () =>
      linearGradientDef(
        GRADIENT_ID,
        [
          { offset: 0, color: lineColor, opacity: 0.25 },
          { offset: 100, color: lineColor, opacity: 0.02 },
        ],
        { x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
      ),
    [lineColor],
  );

  const handleCandleChange = useCallback((c: CandleState | null) => {
    setCandle((prev) => {
      if (!c) return null;
      if (prev?.x === c.x && prev?.y === c.y) return prev;
      return c;
    });
  }, []);

  // Custom candle layer — rebuilt only when hover position or color changes
  const CandleLayer = useMemo(() => buildCandleLayer(candle, lineColor), [candle, lineColor]);

  // Custom inline axis — rebuilt when ticks or format changes
  const InlineAxisLayer = useMemo(() => buildInlineAxisLayer(tickValues, formatXTick), [tickValues, formatXTick]);

  const sliceTooltip = useCallback(
    (props: SliceTooltipProps) => (
      <PointTooltip
        {...props}
        currency={data?.currency ?? 'EUR'}
        lineColor={lineColor}
        onCandleChange={handleCandleChange}
      />
    ),
    [data?.currency, lineColor, handleCandleChange],
  );

  const hasData = !isLoading && !isError && rawPoints.length > 0;

  return (
    <div className="relative" onMouseLeave={() => setCandle(null)}>
      {isError && (
        <div style={{ height: CHART_HEIGHT }} className="flex items-center justify-center">
          <p className="text-sm text-destructive">Failed to load balance history.</p>
        </div>
      )}

      {isLoading && (
        <div style={{ height: CHART_HEIGHT }} className="flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      )}

      {!isLoading && !isError && rawPoints.length === 0 && (
        <div style={{ height: CHART_HEIGHT }} className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data for this period.</p>
        </div>
      )}

      {hasData && (
        <div style={{ height: CHART_HEIGHT }}>
          <ResponsiveLine
            animate={false}
            areaOpacity={1}
            axisBottom={null}
            axisLeft={null}
            axisRight={null}
            axisTop={null}
            colors={[lineColor]}
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
            lineWidth={2}
            margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
            sliceTooltip={sliceTooltip}
            theme={nivoTheme}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
            layers={[
              'grid',
              'axes',
              'areas',
              'lines',
              CandleLayer, // dot + wick indicator (replaces built-in 'crosshair')
              InlineAxisLayer, // date labels rendered inside the chart area
              'slices',
              'mesh',
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(
  BalanceHistoryChart,
  (prev, next) => prev.account.id === next.account.id && (prev.preset ?? '3M') === (next.preset ?? '3M'),
);
