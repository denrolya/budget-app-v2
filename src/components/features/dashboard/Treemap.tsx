import { Treemap, ResponsiveContainer } from 'recharts';
import { ChevronRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  {
    name: 'TECHNOLOGY',
    children: [
      {
        name: 'SOFTWARE - INFRASTRUCTURE',
        children: [
          { name: 'MSFT', value: 100, change: 0.34 },
          { name: 'ORCL', value: 80, change: -0.10 },
          { name: 'ADBE', value: 70, change: 0.05 },
        ],
      },
      {
        name: 'SEMICONDUCTORS',
        children: [
          { name: 'NVDA', value: 150, change: 0.37 },
          { name: 'AMD', value: 90, change: 2.36 },
          { name: 'AVGO', value: 85, change: -0.38 },
          { name: 'TXN', value: 75, change: -1.96 },
          { name: 'INTC', value: 70, change: 0.77 },
        ],
      },
    ],
  },
  {
    name: 'CONSUMER ELECTRONICS',
    children: [
      {
        name: 'CONSUMER ELECTRONICS',
        children: [
          { name: 'AAPL', value: 200, change: 1.63 },
        ],
      },
    ],
  },
  // ... (other data remains unchanged)
];

const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, value, change } = props;

  const isMainCategory = depth === 1;
  const isSubCategory = depth === 2;
  const isStock = depth === 3;

  const color = isStock ? (change >= 0 ? '#4caf50' : '#e53935') : '#37474f';
  const textColor = '#ffffff';

  // Find the parent name for stocks
  const parentName = isStock ?
    root.children.find((category: any) =>
      category.children?.some?.((subCategory: any) =>
        subCategory.children?.some?.((stock: any) => stock.name === name)
      )
    )?.name || 'Unknown' :
    name;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2 / (depth + 1e-10)}
        strokeOpacity={1 / (depth + 1e-10)}
      />
      {width > 50 && height > 30 && (
        <>
          {isStock && (
            <>
              <rect
                x={x}
                y={y}
                width={width}
                height={20}
                fill="#1e2022"
              />
              <ChevronRight
                x={x + 2}
                y={y + 3}
                width={14}
                height={14}
                color={color}
              />
              <text
                x={x + 18}
                y={y + 15}
                fill={textColor}
                fontSize={10}
                fontWeight="bold"
              >
                {parentName}
              </text>
              <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                fill={textColor}
                fontSize={18}
                fontWeight="bold"
              >
                {name}
              </text>
              <text
                x={x + width / 2}
                y={y + height / 2 + 25}
                textAnchor="middle"
                fill={textColor}
                fontSize={14}
              >
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </text>
            </>
          )}
          {!isStock && (
            <text
              x={x + 5}
              y={y + 20}
              fill={textColor}
              fontSize={14}
              fontWeight="bold"
            >
              {name}
            </text>
          )}
        </>
      )}
    </g>
  );
};

export default function Component() {
  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Financial Market Heatmap</CardTitle>
        <CardDescription>Stock performance by sector and industry group</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[800px]">
          <ResponsiveContainer width="100%" height={800}>
            <Treemap
              data={data}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomizedContent />}
            />
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
