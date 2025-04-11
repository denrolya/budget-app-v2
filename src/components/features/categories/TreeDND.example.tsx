import { ResponsiveTree } from '@nivo/tree';
import { hsl } from 'd3-color';
import { useMemo } from 'react';

import { useExpenseCategoriesTree } from '@/contexts/FinanceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Category = {
  id: string;
  name: string;
  children: Category[];
};

const baseColors = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

const generateColorScheme = (categories: Category[], parentColor: string | null = null, depth = 0): any[] =>
  categories.map((category, index) => {
    let color;
    if (parentColor === null) {
      color = baseColors[index % baseColors.length];
    } else {
      const hslColor = hsl(parentColor);
      hslColor.h = (hslColor.h + index * 15) % 360;
      hslColor.s = Math.max(hslColor.s - 0.05 * depth, 0.5);
      hslColor.l = Math.min(hslColor.l + 0.1 * depth + (index % 3) * 0.05, 0.9);
      color = hslColor.toString();
    }

    return {
      id: category.id,
      name: category.name,
      color,
      children: category.children.length > 0 ? generateColorScheme(category.children, color, depth + 1) : undefined,
    };
  });

export default function TreeChart() {
  const categories = useExpenseCategoriesTree();

  const treeData = useMemo(() => generateColorScheme(categories), [categories]);

  if (categories.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Expense Categories Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center">No categories found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Expense Categories Tree</CardTitle>
      </CardHeader>
      <CardContent className="h-[1200px] overflow-auto">
        <div className="h-full" style={{ width: `${Math.max(categories.length * 300, 1200)}px` }}>
          <ResponsiveTree
            data={{ id: 'root', name: 'All Categories', children: treeData }}
            identity="name"
            value="loc"
            mode="tree"
            layout="left-to-right"
            activeNodeSize={24}
            inactiveNodeSize={12}
            nodePadding={20} // Reduced padding to bring levels closer
            nodeColor={(node) => node.data.color}
            linkThickness={1}
            enableLinkGradient={false}
            margin={{ top: 160, right: 160, bottom: 160, left: 160 }}
            motionConfig="stiff"
            enableLabels={true}
            labelPosition="layout"
            labelTextColor={{
              from: 'color',
              modifiers: [['darker', 2]],
            }}
            labelSkipSize={8}
            separation={{ siblings: 2, nonSiblings: 4 }} // Reduced separation between nodes
            tooltip={({ node }) => (
              <div className="bg-white p-2 shadow rounded">
                <strong>{node.data.name}</strong>
                {node.data.children && (
                  <p className="text-sm text-gray-500">Subcategories: {node.data.children.length}</p>
                )}
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
