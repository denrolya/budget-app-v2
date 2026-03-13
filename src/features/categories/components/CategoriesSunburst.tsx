import { ResponsiveSunburst } from '@nivo/sunburst';
import React, { useMemo } from 'react';

import type Category from '@/features/categories/models/Category';
import type { Type as TransactionType } from '@/features/transactions';

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

const SunburstTooltip: React.FC<SunburstTooltipArgs> = ({ id, value, color }) => (
    <div className="rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground shadow-md">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          style={{ backgroundColor: color ?? 'transparent' }}
          className="h-2.5 w-2.5 rounded-full"
        />
        <span className="text-xs font-medium leading-5">{String(id)}</span>
        <span className="text-xs leading-5 text-muted-foreground">{Number.isFinite(value) ? value : 0}</span>
      </div>
    </div>
  );

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
        enableArcLabels
        arcLabel={(d) => `${String(d.id)} (${d.value})`}
        arcLabelsRadiusOffset={0.55}
        arcLabelsSkipAngle={20}
        borderColor={{ theme: 'background' }}
        borderWidth={10}
        colors={{ scheme: 'nivo' }}
        cornerRadius={10}
        data={rootData}
        id="name"
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        motionConfig="wobbly"
        tooltip={({ id, value, color }) => <SunburstTooltip color={color} id={id} value={value} />}
        value="value"
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 1.4]],
        }}
        childColor={{
          from: 'color',
          modifiers: [['darker', 0.4]],
        }}
      />
    </div>
  );
};

export default CategoriesSunburst;
