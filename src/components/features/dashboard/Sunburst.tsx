import { ResponsiveSunburst } from '@nivo/sunburst';
import React, { useState, useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from '@/contexts/FinanceData';

const addValueToNodes = (node) => {
  node.value = 1;
  if (node.children && node.children.length > 0) {
    node.children = node.children.map(addValueToNodes);
  }
  return node;
};

interface EnhancedExpenseSunburstChartProps {
  type?: 'income' | 'expense';
}

export default function EnhancedExpenseSunburstChart({ type }: EnhancedExpenseSunburstChartProps) {
  const { tree: categories } = useCategories();

  const filteredCategories = useMemo(() => {
    if (type === 'income') {
      return categories.filter(c => c.type === 'income').map(c => addValueToNodes(c));
    } else if (type === 'expense') {
      return categories.filter(c => c.type === 'expense').map(c => addValueToNodes(c));
    } else {
      return categories.map(c => addValueToNodes(c));
    }
  }, [categories, type]);

  const initialData = useMemo(() => ({ name: 'Categories', children: filteredCategories.filter(c => c.type === type) }), [filteredCategories, type]);

  const [data, setData] = useState(initialData);

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Detailed Expense Breakdown</CardTitle>
        <CardDescription>Monthly expenses visualized in a multi-level sunburst chart</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveSunburst
            data={data}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            id="name"
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
            arcLabel={d => `${d.id} (${d.value})`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
