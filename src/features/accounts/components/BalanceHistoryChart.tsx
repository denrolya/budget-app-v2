import { linearGradientDef } from '@nivo/core';
import { ResponsiveLine, type SliceTooltipProps } from '@nivo/line';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useBalanceHistory } from '@/features/accounts/api';
import Account from '@/features/accounts/models/Account';

interface Props {
  account: Account;
}

const PRESETS = [
  { label: '1M', months: 1, interval: 'P1D' },
  { label: '3M', months: 3, interval: 'P1W' },
  { label: '6M', months: 6, interval: 'P1W' },
  { label: '1Y', months: 12, interval: 'P1M' },
] as const;

type PresetLabel = (typeof PRESETS)[number]['label'];

const CHART_HEIGHT = 180;

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

const GRADIENT_ID = 'balanceGradient';

const BalanceHistoryChart: React.FC<Props> = ({ account }) => {
  const [preset, setPreset] = useState<PresetLabel>('3M');
  const selected = PRESETS.find((p) => p.label === preset)!;

  const { after, before } = useMemo(
    () => ({
      before: moment().endOf('day'),
      after: moment().subtract(selected.months, 'months').startOf('day'),
    }),
    [selected.months],
  );

  const { data, isLoading, isError } = useBalanceHistory(account.id, after, before, selected.interval);

  const rawPoints = data?.data ?? [];
  const lastBalance = rawPoints[rawPoints.length - 1]?.balance ?? 0;
  const isPositive = lastBalance >= 0;
  const lineColor = `hsl(var(${isPositive ? '--success' : '--destructive'}))`;

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

  const tickValues = useMemo(() => {
    if (selected.interval !== 'P1D' || rawPoints.length <= 14) return undefined;
    const step = Math.ceil(rawPoints.length / 6);
    return rawPoints
      .filter((_, i) => i === 0 || i === rawPoints.length - 1 || i % step === 0)
      .map((p) => moment.unix(p.timestamp).format('YYYY-MM-DD'));
  }, [rawPoints, selected.interval]);

  const formatXTick = (value: string) => {
    const d = moment(value, 'YYYY-MM-DD');
    return selected.interval === 'P1M' ? d.format('MMM') : d.format('D MMM');
  };

  const SliceTooltip = ({ slice }: SliceTooltipProps) => {
    const point = slice.points[0];
    if (!point) return null;
    const balance = point.data.y as number;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data?.currency ?? 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance);

    return (
      <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm">
        <p className="text-muted-foreground mb-1">
          {moment(point.data.x as string, 'YYYY-MM-DD').format('D MMM YYYY')}
        </p>
        <p className={`font-semibold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>{formatted}</p>
      </div>
    );
  };

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

  const hasData = !isLoading && !isError && rawPoints.length > 0;

  return (
    <div className="relative">
      {/* Preset toggle — floats over the top-right of the chart */}
      <div className="absolute top-2 right-3 z-10">
        <ToggleGroup size="sm" type="single" value={preset} onValueChange={(v) => v && setPreset(v as PresetLabel)}>
          {PRESETS.map((p) => (
            <ToggleGroupItem value={p.label} className="text-xs px-2" key={p.label}>
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

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
            // top leaves room for preset buttons; sides/bottom flush to card edges
            margin={{ top: 40, right: 0, bottom: 22, left: 0 }}
            sliceTooltip={SliceTooltip}
            theme={nivoTheme}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
            axisBottom={{
              tickValues,
              format: formatXTick,
              tickSize: 0,
              tickPadding: 5,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(BalanceHistoryChart, (prevProps, nextProps) => prevProps.account.id === nextProps.account.id);
