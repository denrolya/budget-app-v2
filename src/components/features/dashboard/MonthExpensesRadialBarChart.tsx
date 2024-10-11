import { ResponsiveRadialBar } from '@nivo/radial-bar';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Sample nested expense data
const data = [
  {
    'id': 'Housing',
    'data': [
      {
        'x': 'Rent',
        'y': 1200
      },
      {
        'x': 'Utilities',
        'y': 200
      },
      {
        'x': 'Insurance',
        'y': 100
      }
    ]
  },
  {
    'id': 'Food',
    'data': [
      {
        'x': 'Groceries',
        'y': 400
      },
      {
        'x': 'Dining Out',
        'y': 200
      }
    ]
  },
  {
    'id': 'Transportation',
    'data': [
      {
        'x': 'Car Payment',
        'y': 300
      },
      {
        'x': 'Gas',
        'y': 150
      },
      {
        'x': 'Public Transit',
        'y': 50
      }
    ]
  },
  {
    'id': 'Entertainment',
    'data': [
      {
        'x': 'Streaming Services',
        'y': 50
      },
      {
        'x': 'Movies/Events',
        'y': 100
      }
    ]
  }
];

export default function Component() {
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Monthly Expenses Breakdown</CardTitle>
        <CardDescription>Nested categories visualized in a radial bar chart</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveRadialBar
            data={data}
            valueFormat=">$.2f"
            padding={0.4}
            cornerRadius={2}
            margin={{ top: 40, right: 120, bottom: 40, left: 40 }}
            radialAxisStart={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
            circularAxisOuter={{ tickSize: 5, tickPadding: 12, tickRotation: 0 }}
            legends={[
              {
                anchor: 'right',
                direction: 'column',
                justify: false,
                translateX: 80,
                translateY: 0,
                itemsSpacing: 6,
                itemDirection: 'left-to-right',
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: '#999',
                symbolSize: 18,
                symbolShape: 'square',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000'
                    }
                  }
                ]
              }
            ]}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fill: 'hsl(var(--foreground))'
                  }
                }
              },
              legends: {
                text: {
                  fill: 'hsl(var(--foreground))'
                }
              },
              tooltip: {
                container: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: 12
                }
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
