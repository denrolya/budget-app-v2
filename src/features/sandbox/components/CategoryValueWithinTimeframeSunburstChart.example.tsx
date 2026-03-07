import { ResponsiveSunburst } from '@nivo/sunburst';
import { Moment } from 'moment';
import React, { useMemo } from 'react';

import { Type as TransactionType } from '@/features/transactions';
import { useCategoryTreeStatistics } from '@/hooks/statistics/useCategoryTreeStatistics';

interface CategoryNode {
  id: number;
  name: string;
  children?: CategoryNode[];
  total: number;
  value: number;
}

interface CategoryValueWithinTimeframeSunburstChartProps {
  type: TransactionType;
  after: Moment;
  before: Moment;
}

const processData = (categories: CategoryNode[]): { name: string; children: CategoryNode[] } => {
  const processNode = (node: CategoryNode): CategoryNode => ({
    ...node,
    children: node.children ? node.children.map(processNode) : undefined,
    value: node.total,
  });

  return {
    name: 'Categories',
    children: categories.map(processNode),
  };
};

const CustomTooltip = ({
  id,
  value,
  color,
  percentage,
}: {
  id: string;
  value: number;
  color: string;
  percentage: number;
}) => (
  <div style={{ background: 'white', padding: '9px 12px', border: `1px solid ${color}` }}>
    <strong>{id}</strong>
    <div>Value: {value.toFixed(2)}</div>
    <div>Percentage: {percentage.toFixed(2)}%</div>
  </div>
);

export const CategoryValueWithinTimeframeSunburstChart: React.FC<CategoryValueWithinTimeframeSunburstChartProps> = ({
  type,
  after,
  before,
}) => {
  const { data, isLoading, error } = useCategoryTreeStatistics({ after, before, type });

  const processedData = useMemo(() => {
    if (!data) return { name: 'Categories', children: [] };
    return processData(data as unknown as CategoryNode[]);
  }, [data]);

  const totalValue = useMemo(() => {
    if (!processedData.children) return 0;
    return processedData.children.reduce((sum, node) => sum + (node.value || 0), 0);
  }, [processedData]);

  if (isLoading) return <div className="h-[500px] flex items-center justify-center">Loading...</div>;
  if (error)
    return (
      <div className="h-[500px] flex items-center justify-center text-red-500" role="alert">
        Error: {error.message}
      </div>
    );

  return (
    <div className="h-[500px]" aria-label="Categories Sunburst Chart">
      <ResponsiveSunburst
        data={processedData}
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
        enableArcLabels={true}
        arcLabelsRadiusOffset={0.55}
        arcLabelsSkipAngle={20}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 1.4]],
        }}
        motionConfig="wobbly"
        arcLabel={(d) => `${d.id} (${d.value.toFixed(2)})`}
        tooltip={({ id, value, color }) => (
          <CustomTooltip id={id as string} value={value} color={color} percentage={(value / totalValue) * 100} />
        )}
      />
    </div>
  );
};

export default CategoryValueWithinTimeframeSunburstChart;
