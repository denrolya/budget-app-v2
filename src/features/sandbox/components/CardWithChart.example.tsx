import { ResponsiveLine } from '@nivo/line';
import { ChevronUp, MoreVertical } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  {
    id: 'productivity',
    color: 'white',
    data: [
      { x: 'Jan', y: 20 },
      { x: 'Feb', y: 30 },
      { x: 'Mar', y: 25 },
      { x: 'Apr', y: 40 },
      { x: 'May', y: 35 },
      { x: 'Jun', y: 50 },
      { x: 'Jul', y: 45 },
      { x: 'Aug', y: 60 },
      { x: 'Sep', y: 55 },
      { x: 'Oct', y: 75 },
      { x: 'Nov', y: 70 },
      { x: 'Dec', y: 90 },
    ],
  },
];

export default function ProductivityCard() {
  return (
    <Card className="w-full max-w-md bg-zinc-800 text-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Productivity</CardTitle>
        <MoreVertical className="h-4 w-4 text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <ChevronUp className="h-4 w-4 text-green-500" />
          <span className="text-2xl font-bold">4% more</span>
          <span className="text-sm text-zinc-400">in 2021</span>
        </div>
        <div className="h-[200px] w-full pt-4">
          <ResponsiveLine
            data={data}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            xScale={{ type: 'point' }}
            yScale={{
              type: 'linear',
              min: 'auto',
              max: 'auto',
              stacked: true,
              reverse: false,
            }}
            curve="monotoneX"
            axisTop={null}
            axisRight={null}
            axisBottom={null}
            axisLeft={null}
            enableGridX={false}
            enableGridY={false}
            enablePoints={false}
            colors={{ scheme: 'white' }}
            lineWidth={2}
            pointSize={4}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            enableArea={true}
            areaOpacity={0.1}
            useMesh={true}
            animate={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
