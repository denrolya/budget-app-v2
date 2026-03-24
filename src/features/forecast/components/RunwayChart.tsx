import moment from 'moment';
import React, { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import { CHART_STYLES } from '@/constants/recharts';

import { formatChartTick } from '../constants';
import type { ProjectionPoint, ReferenceLine as ReferenceLineType, ScenarioEvent } from '../models/types';

interface ChartPoint extends ProjectionPoint {
  timestamp: number;
  bandRange: [number, number];
  netWorth: number;
  /** Investment value only for forecast points — undefined for historical */
  investmentProjected?: number;
  compareNetWorth?: number;
}

const EVENT_COLORS: Record<ScenarioEvent['type'], string> = {
  income: 'hsl(var(--success))',
  expense: 'hsl(var(--destructive))',
  investment: 'hsl(var(--primary))',
  withdrawal: 'hsl(var(--warning))',
};

const REF_LINE_COLORS: Record<ReferenceLineType['color'], string> = {
  success: 'hsl(var(--success) / 0.5)',
  warning: 'hsl(var(--warning) / 0.5)',
  destructive: 'hsl(var(--destructive) / 0.5)',
  primary: 'hsl(var(--primary) / 0.5)',
  muted: 'hsl(var(--muted-foreground) / 0.3)',
};

interface Props {
  data: ProjectionPoint[];
  events?: ScenarioEvent[];
  fiTarget?: number;
  minCashReserve?: number;
  referenceLines?: ReferenceLineType[];
  compareData?: ProjectionPoint[] | null;
  compareName?: string;
}

const RunwayChart: React.FC<Props> = ({
  data,
  events = [],
  fiTarget,
  minCashReserve,
  referenceLines = [],
  compareData,
  compareName,
}) => {
  const compareMap = useMemo(() => {
    if (!compareData) return null;
    return new Map(compareData.map((p) => [moment(p.date).unix(), p]));
  }, [compareData]);

  const chartData = useMemo<ChartPoint[]>(
    () =>
      data.map((p) => {
        const ts = moment(p.date).unix();
        const cmp = compareMap?.get(ts);
        return {
          ...p,
          timestamp: ts,
          bandRange: [p.balanceLower + p.investmentValue, p.balanceUpper + p.investmentValue] as [number, number],
          netWorth: p.balance + p.investmentValue,
          investmentProjected: p.isForecast ? p.investmentValue : undefined,
          compareNetWorth: cmp ? cmp.balance + cmp.investmentValue : undefined,
        };
      }),
    [data, compareMap],
  );

  // Extend Y-axis to show FI target if it's above max data
  const yDomain = useMemo(() => {
    if (!fiTarget || fiTarget <= 0) return undefined;
    const maxVal = Math.max(...chartData.map((d) => Math.max(d.netWorth, d.bandRange[1])));
    if (fiTarget > maxVal) return [0, Math.ceil(fiTarget * 1.05)];
    return undefined;
  }, [fiTarget, chartData]);

  const nowTimestamp = useMemo(() => moment().startOf('month').unix(), []);
  const hasForecast = data.some((p) => p.isForecast);
  const hasInvestments = data.some((p) => p.investmentValue > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-xs font-mono text-muted-foreground/50">No data available</span>
      </div>
    );
  }

  return (
    <div className="chart-enter w-full h-full min-w-[600px]">
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart data={chartData} margin={{ top: 12, right: 30, bottom: 0, left: -30 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'hsl(var(--foreground) / 0.08)' }} />
              <stop offset="100%" style={{ stopColor: 'hsl(var(--foreground) / 0.01)' }} />
            </linearGradient>
          </defs>

          <CartesianGrid {...CHART_STYLES.cartesianGrid} />

          <XAxis
            dataKey="timestamp"
            scale="time"
            tickFormatter={formatChartTick}
            type="number"
            {...CHART_STYLES.xAxis}
          />
          <YAxis domain={yDomain} {...CHART_STYLES.yAxis} />

          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const point = payload[0].payload as ChartPoint;
              const dateLabel = moment(point.date).format('MMM YYYY');
              const isFcast = point.isForecast;
              const hasCompare = point.compareNetWorth != null;
              const nwDelta = hasCompare ? point.netWorth - (point.compareNetWorth ?? 0) : 0;
              const cashBalance = point.balance;

              return (
                <Card className="shadow-lg">
                  <CardContent className="p-2 space-y-1.5">
                    <p className="text-xs font-medium">
                      {dateLabel}
                      {isFcast && <span className="text-muted-foreground ml-1">Forecast</span>}
                    </p>
                    <div className="text-xs font-mono tabular-nums space-y-0.5">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground font-medium">Net Worth</span>
                        <span className="font-medium">{Math.round(point.netWorth).toLocaleString()}</span>
                      </div>
                      {/* Composition breakdown */}
                      <div className="flex justify-between gap-4 pl-2">
                        <span className="text-muted-foreground/60">Cash</span>
                        <span className="text-muted-foreground">{Math.round(cashBalance).toLocaleString()}</span>
                      </div>
                      {hasInvestments && (
                        <div className="flex justify-between gap-4 pl-2">
                          <span className="text-muted-foreground/60">Investments</span>
                          <span className="text-muted-foreground">
                            {Math.round(point.investmentValue).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {isFcast && (
                        <>
                          <div className="flex justify-between gap-4 border-t border-border/50 pt-0.5">
                            <span className="text-muted-foreground">Range</span>
                            <span className="text-muted-foreground">
                              {Math.round(point.bandRange[0]).toLocaleString()} –{' '}
                              {Math.round(point.bandRange[1]).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Flow/mo</span>
                            <span className={point.netFlow >= 0 ? 'text-success' : 'text-destructive'}>
                              {point.netFlow >= 0 ? '+' : ''}
                              {Math.round(point.netFlow).toLocaleString()}
                            </span>
                          </div>
                          {point.investmentContribution > 0 && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">→ Invest</span>
                              <span className="text-primary">
                                +{Math.round(point.investmentContribution).toLocaleString()}/mo
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Comparison block — neutral color, not green */}
                    {hasCompare && (
                      <div className="border-t border-border/50 pt-1.5 space-y-0.5">
                        <p className="text-2xs font-medium text-chart-4 uppercase tracking-widest">
                          {compareName ?? 'Compare'}
                        </p>
                        <div className="text-xs font-mono tabular-nums space-y-0.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Net Worth</span>
                            <span className="text-chart-4">
                              {Math.round(point.compareNetWorth ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 border-t border-border/50 pt-0.5">
                            <span className="text-muted-foreground">Δ</span>
                            <span className={nwDelta >= 0 ? 'text-success' : 'text-destructive'}>
                              {nwDelta >= 0 ? '+' : ''}
                              {Math.round(nwDelta).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }}
          />

          {/* Net worth filled area — primary layer */}
          <Area dataKey="netWorth" fill="url(#netWorthGradient)" stroke="none" type="monotone" />

          {/* Confidence band around net worth */}
          <Area
            dataKey="bandRange"
            fill="url(#netWorthGradient)"
            stroke="hsl(var(--foreground) / 0.1)"
            strokeWidth={1}
            type="monotone"
          />

          {/* Comparison net worth — neutral color (not green) */}
          {compareMap && (
            <Line
              connectNulls={false}
              dataKey="compareNetWorth"
              dot={false}
              stroke="hsl(var(--chart-4))"
              strokeDasharray="8 6"
              strokeOpacity={0.7}
              strokeWidth={2}
              type="monotone"
            />
          )}

          {/* Investment line — forecast only, subtle secondary */}
          {hasInvestments && (
            <Line
              connectNulls={false}
              dataKey="investmentProjected"
              dot={false}
              stroke="hsl(var(--chart-2))"
              strokeOpacity={0.5}
              strokeWidth={1}
              type="monotone"
            />
          )}

          {/* Net worth — primary bold line */}
          <Line
            dataKey="netWorth"
            dot={false}
            stroke="hsl(var(--foreground) / 0.8)"
            strokeWidth={2.5}
            type="monotone"
          />

          {/* "Now" divider */}
          {hasForecast && (
            <ReferenceLine
              stroke="hsl(var(--foreground) / 0.3)"
              strokeDasharray="4 4"
              x={nowTimestamp}
              label={{
                position: 'top',
                value: 'Now',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10,
                fontWeight: 400,
              }}
            />
          )}

          {/* Event markers — grouped by month to avoid overlapping labels */}
          {(() => {
            const active = events.filter((e) => e.isActive);
            const byMonth = new Map<number, typeof active>();
            for (const event of active) {
              const ts = moment(event.month).unix();
              const group = byMonth.get(ts) ?? [];
              group.push(event);
              byMonth.set(ts, group);
            }
            return Array.from(byMonth.entries()).map(([ts, group]) => {
              const combinedLabel = group.map((e) => e.label).join(' · ');
              const primaryColor = EVENT_COLORS[group[0].type];
              return (
                <ReferenceLine
                  stroke={primaryColor}
                  strokeDasharray="6 4"
                  strokeOpacity={0.7}
                  x={ts}
                  label={{
                    position: 'top',
                    value: combinedLabel,
                    fill: primaryColor,
                    fontSize: 9,
                    fontWeight: 400,
                  }}
                  key={ts}
                />
              );
            });
          })()}

          {/* User reference lines */}
          {referenceLines.map((line) => (
            <ReferenceLine
              stroke={REF_LINE_COLORS[line.color]}
              strokeDasharray="6 4"
              y={line.value}
              label={{
                position: 'right',
                value: `${line.label} ${line.value.toLocaleString()}`,
                fill: REF_LINE_COLORS[line.color],
                fontSize: 9,
              }}
              key={line.id}
            />
          ))}

          {/* FI target line */}
          {fiTarget != null && fiTarget > 0 && (
            <ReferenceLine
              stroke="hsl(var(--success) / 0.5)"
              strokeDasharray="8 4"
              y={fiTarget}
              label={{
                position: 'right',
                value: `FI ${fiTarget.toLocaleString()}`,
                fill: 'hsl(var(--success) / 0.6)',
                fontSize: 9,
              }}
            />
          )}

          {/* Min cash reserve floor */}
          {minCashReserve != null && minCashReserve > 0 && (
            <ReferenceLine
              stroke="hsl(var(--warning) / 0.4)"
              strokeDasharray="4 4"
              y={minCashReserve}
              label={{
                position: 'right',
                value: `Reserve ${minCashReserve.toLocaleString()}`,
                fill: 'hsl(var(--warning) / 0.5)',
                fontSize: 9,
              }}
            />
          )}

          {/* Zero reference line */}
          <ReferenceLine {...CHART_STYLES.referenceLine} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RunwayChart;
