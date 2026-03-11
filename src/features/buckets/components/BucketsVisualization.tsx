import { ResponsivePie } from '@nivo/pie';
import { ResponsiveTreeMap } from '@nivo/treemap';
import React, { useMemo } from 'react';

import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';

import { Bucket, BucketEntry, UnassignedEntry } from '../models/types';

interface Props {
  buckets: Bucket[];
  entriesByBucket: Record<string, BucketEntry[]>;
  unassignedEntries: UnassignedEntry[];
  baseCurrency: string;
  visualization: 'treemap' | 'pie';
}

const UNASSIGNED: Bucket = {
  id: '__unassigned__',
  name: 'Unassigned',
  emoji: '📦',
  color: '#94a3b8',
  isPreset: false,
};

const nivoTheme = {
  background: 'transparent',
  text: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 },
};

const fmtMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const BucketsVisualization: React.FC<Props> = ({
  buckets,
  entriesByBucket,
  unassignedEntries,
  baseCurrency,
  visualization,
}) => {
  const allBuckets = useMemo(
    () => (unassignedEntries.length > 0 ? [...buckets, UNASSIGNED] : buckets),
    [buckets, unassignedEntries.length],
  );

  // ── Treemap ─────────────────────────────────────────────────────────────────

  const treemapData = useMemo(() => {
    const children = allBuckets
      .map((bucket) => {
        const leafEntries =
          bucket.id === '__unassigned__'
            ? unassignedEntries.map((e) => ({
                id: `unassigned-${e.account.id}`,
                accountName: e.account.name,
                accountBalance: e.unallocatedAmount,
                accountCurrency: e.account.currency,
                convertedValue: e.unallocatedBalance,
                value: Math.max(0.001, e.unallocatedBalance),
                color: bucket.color,
              }))
            : (entriesByBucket[bucket.id] ?? []).map((e) => ({
                id: `entry-${e.account.id}-${bucket.id}`,
                accountName: e.account.name,
                accountBalance: e.amount,
                accountCurrency: e.account.currency,
                convertedValue: e.allocatedBalance,
                value: Math.max(0.001, e.allocatedBalance),
                color: bucket.color,
              }));

        if (leafEntries.length === 0) return null;

        return {
          id: `bucket-${bucket.id}`,
          name: `${bucket.emoji} ${bucket.name}`,
          color: bucket.color,
          children: leafEntries,
        };
      })
      .filter(Boolean);

    return { id: 'root', children };
  }, [allBuckets, entriesByBucket, unassignedEntries]);

  // ── Pie ─────────────────────────────────────────────────────────────────────

  const pieData = useMemo(
    () =>
      allBuckets
        .map((bucket) => {
          const total =
            bucket.id === '__unassigned__'
              ? unassignedEntries.reduce((s, e) => s + e.unallocatedBalance, 0)
              : (entriesByBucket[bucket.id] ?? []).reduce((s, e) => s + e.allocatedBalance, 0);
          if (total <= 0) return null;
          return {
            id: bucket.id,
            label: `${bucket.emoji} ${bucket.name}`,
            value: total,
            color: bucket.color,
          };
        })
        .filter(Boolean) as { id: string; label: string; value: number; color: string }[],
    [allBuckets, entriesByBucket, unassignedEntries],
  );

  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  if (visualization === 'treemap') {
    if (!treemapData.children || treemapData.children.length === 0) return <EmptyState />;

    return (
      <ResponsiveTreeMap
        enableLabel
        leavesOnly
        borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
        borderWidth={1}
        colors={(node) => (node.data as any).color ?? '#888'}
        data={treemapData as any}
        identity="id"
        innerPadding={3}
        label={(node) => (node.data as any).accountName ?? node.id}
        labelSkipSize={32}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        outerPadding={6}
        theme={nivoTheme}
        tile="squarify"
        value="value"
        valueFormat={(v) => fmtMoney(v, baseCurrency)}
        tooltip={({ node }) => {
          const d = node.data as any;
          return (
            <div className="bg-background border rounded-lg shadow-lg px-3 py-2 text-sm min-w-[160px]">
              <div className="font-semibold mb-1">{d.accountName ?? node.id}</div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>{fmtMoney(d.convertedValue, baseCurrency)}</div>
                {d.accountCurrency !== baseCurrency && (
                  <div className="opacity-70">
                    {CURRENCIES[d.accountCurrency as CURRENCY_CODE]?.symbol ?? d.accountCurrency}
                    {Math.abs(d.accountBalance).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    );
  }

  // Pie
  if (pieData.length === 0) return <EmptyState />;

  return (
    <ResponsivePie
      arcLabel={(d) => `${((d.value / totalPie) * 100).toFixed(0)}%`}
      arcLabelsSkipAngle={12}
      arcLinkLabel={(d) => d.data.label}
      arcLinkLabelsColor={{ from: 'color' }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="hsl(var(--foreground))"
      arcLinkLabelsThickness={1}
      borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
      borderWidth={1}
      colors={(d) => d.data.color}
      cornerRadius={3}
      data={pieData}
      innerRadius={0.5}
      margin={{ top: 20, right: 100, bottom: 20, left: 100 }}
      padAngle={2}
      theme={nivoTheme}
      tooltip={({ datum }) => (
        <div className="bg-background border rounded-lg shadow-lg px-3 py-2 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ backgroundColor: datum.color }} className="h-2.5 w-2.5 rounded-sm shrink-0" />
            <span className="font-semibold">{datum.label}</span>
          </div>
          <div className="text-xs text-muted-foreground">{fmtMoney(datum.value, baseCurrency)}</div>
        </div>
      )}
    />
  );
};

const EmptyState: React.FC = () => (
  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
    Assign accounts to buckets to see the visualization
  </div>
);

export default BucketsVisualization;
