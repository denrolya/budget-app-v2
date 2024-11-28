import { ResponsiveHeatMap } from '@nivo/heatmap';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for the entire year
const data = [
  {
    'month': 'Jan',
    'Food': 120,
    'Transport': 80,
    'Entertainment': 60,
    'Utilities': 150,
    'Shopping': 100,
  },
  {
    'month': 'Feb',
    'Food': 110,
    'Transport': 75,
    'Entertainment': 80,
    'Utilities': 140,
    'Shopping': 90,
  },
  {
    'month': 'Mar',
    'Food': 130,
    'Transport': 85,
    'Entertainment': 70,
    'Utilities': 160,
    'Shopping': 110,
  },
  {
    'month': 'Apr',
    'Food': 125,
    'Transport': 78,
    'Entertainment': 65,
    'Utilities': 155,
    'Shopping': 105,
  },
  {
    'month': 'May',
    'Food': 135,
    'Transport': 82,
    'Entertainment': 75,
    'Utilities': 145,
    'Shopping': 115,
  },
  {
    'month': 'Jun',
    'Food': 140,
    'Transport': 88,
    'Entertainment': 85,
    'Utilities': 170,
    'Shopping': 120,
  },
  {
    'month': 'Jul',
    'Food': 145,
    'Transport': 90,
    'Entertainment': 95,
    'Utilities': 180,
    'Shopping': 130,
  },
  {
    'month': 'Aug',
    'Food': 150,
    'Transport': 92,
    'Entertainment': 100,
    'Utilities': 185,
    'Shopping': 140,
  },
  {
    'month': 'Sep',
    'Food': 140,
    'Transport': 86,
    'Entertainment': 90,
    'Utilities': 175,
    'Shopping': 125,
  },
  {
    'month': 'Oct',
    'Food': 135,
    'Transport': 84,
    'Entertainment': 80,
    'Utilities': 165,
    'Shopping': 120,
  },
  {
    'month': 'Nov',
    'Food': 130,
    'Transport': 82,
    'Entertainment': 75,
    'Utilities': 160,
    'Shopping': 110,
  },
  {
    'month': 'Dec',
    'Food': 150,
    'Transport': 90,
    'Entertainment': 120,
    'Utilities': 180,
    'Shopping': 200,
  },
];

export const SpendingHeatmap = () => {
  return (
    <Card className="w-full h-[500px]">
      <CardHeader>
        <CardTitle>Yearly Spending Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="h-[450px]">
        <ResponsiveHeatMap
          data={data}
          keys={[
            'Food',
            'Transport',
            'Entertainment',
            'Utilities',
            'Shopping',
          ]}
          indexBy="month"
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          forceSquare={true}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: '',
            legendOffset: 46,
          }}
          axisRight={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Categories',
            legendPosition: 'middle',
            legendOffset: 70,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Months',
            legendPosition: 'middle',
            legendOffset: -72,
          }}
          colors={{
            type: 'sequential',
            scheme: 'blues',
          }}
          emptyColor="#eeeeee"
          labelTextColor={{
            from: 'color',
            modifiers: [
              [
                'darker',
                2,
              ],
            ],
          }}
          legends={[
            {
              anchor: 'bottom',
              translateX: 0,
              translateY: 30,
              length: 400,
              thickness: 8,
              direction: 'row',
              tickPosition: 'after',
              tickSize: 3,
              tickSpacing: 4,
              tickOverlap: false,
              title: 'Spending Amount',
              titleAlign: 'start',
              titleOffset: 4,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

export default SpendingHeatmap;
