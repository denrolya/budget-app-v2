import type Category from '@/features/categories/models/Category';
import type { Type as TransactionType } from '@/features/transactions';
import { ResponsiveSunburst } from '@nivo/sunburst';
import React, { useMemo } from 'react';

type SunburstNode = {
  name: string;
  value?: number;
  color?: string | null;
  children?: SunburstNode[];
};

interface CategoriesSunburstProps {
  categories: Category[];
  type?: TransactionType;
  height?: number | string;
}

const toSunburstNode = (node: Category): SunburstNode => ({
  name: node.name,
  value: 1,
  color: (node as unknown as { color?: string | null }).color ?? null,
  children: node.children?.length ? node.children.map(toSunburstNode) : undefined,
});

type SunburstTooltipArgs = {
  id: string | number;
  value: number;
  color?: string;
};

const SunburstTooltip: React.FC<SunburstTooltipArgs> = ({ id, value, color }) => {
  return (
    <div className="rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground shadow-md">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color ?? 'transparent' }}
        />
        <span className="text-xs font-medium leading-5">{String(id)}</span>
        <span className="text-xs leading-5 text-muted-foreground">{Number.isFinite(value) ? value : 0}</span>
      </div>
    </div>
  );
};

export const CategoriesSunburst: React.FC<CategoriesSunburstProps> = ({ categories, height = 500 }) => {
  const rootData: SunburstNode = useMemo(
    () => ({
      name: 'Categories',
      children: categories.map(toSunburstNode),
    }),
    [categories],
  );

  return (
    <div style={{ height }}>
      <ResponsiveSunburst<SunburstNode>
        data={rootData}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        id="name"
        value="value"
        cornerRadius={10}
        borderWidth={10}
        borderColor={{ theme: 'background' }}
        colors={{ scheme: 'nivo' }}
        childColor={{
          from: 'color',
          modifiers: [['darker', 0.4]],
        }}
        enableArcLabels
        arcLabelsRadiusOffset={0.55}
        arcLabelsSkipAngle={20}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 1.4]],
        }}
        motionConfig="wobbly"
        tooltip={({ id, value, color }) => <SunburstTooltip id={id} value={value} color={color} />}
        arcLabel={(d) => `${String(d.id)} (${d.value})`}
      />
    </div>
  );
};

export default CategoriesSunburst;
