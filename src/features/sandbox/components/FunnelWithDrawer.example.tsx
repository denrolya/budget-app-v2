import { ResponsiveFunnel } from '@nivo/funnel';
import { useCallback, useRef, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MonthDataDrawer from '@/features/sandbox/components/MonthDataDrawer.example';

const monthlyData = [
  { id: 'Jan', value: 1000, expenses: 7000 },
  { id: 'Feb', value: 7000, expenses: 2000 },
  { id: 'Mar', value: 6000, expenses: 4500 },
  { id: 'Apr', value: 5800, expenses: 4300 },
  { id: 'May', value: 6200, expenses: 4800 },
  { id: 'Jun', value: 6500, expenses: 5000 },
  { id: 'Jul', value: 7000, expenses: 5200 },
  { id: 'Aug', value: 7200, expenses: 5500 },
  { id: 'Sep', value: 6800, expenses: 5100 },
  { id: 'Oct', value: 7500, expenses: 5800 },
  { id: 'Nov', value: 7800, expenses: 6000 },
  { id: 'Dec', value: 8500, expenses: 6500 },
];

export default function Component() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [tooltipContent, setTooltipContent] = useState<{ id: string; value: number; expenses: number } | null>(null);
  const lastTap = useRef(0);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleInteraction = useCallback((data: { id: string; value: number; expenses: number }) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      setSelectedMonth(data.id);
      setIsDrawerOpen(true);
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
      }
      setTooltipContent(null);
    } else {
      // Single tap
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
      }
      tooltipTimeout.current = setTimeout(() => {
        setTooltipContent(data);
      }, 100);
    }

    lastTap.current = now;
  }, []);

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Yearly Income and Expenses Funnel</CardTitle>
        <CardDescription>
          Double-click (desktop) or double-tap (mobile) on a section for detailed information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Tooltip open={!!tooltipContent}>
            <TooltipTrigger asChild>
              <div className="h-[500px]">
                <ResponsiveFunnel
                  data={monthlyData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  valueFormat=">-.4s"
                  colors={{ scheme: 'spectral' }}
                  borderWidth={20}
                  labelColor={{
                    from: 'color',
                    modifiers: [['darker', 3]],
                  }}
                  beforeSeparatorLength={100}
                  beforeSeparatorOffset={20}
                  afterSeparatorLength={100}
                  afterSeparatorOffset={20}
                  currentPartSizeExtension={10}
                  currentBorderWidth={40}
                  motionConfig="wobbly"
                  onClick={handleInteraction}
                  onDoubleClick={(data) => {
                    setSelectedMonth(data.id);
                    setIsDrawerOpen(true);
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {tooltipContent && (
                <div>
                  <p className="font-bold">{tooltipContent.id}</p>
                  <p>Income: ${tooltipContent.value}</p>
                  <p>Expenses: ${tooltipContent.expenses}</p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>

      <MonthDataDrawer isOpen={isDrawerOpen} setIsOpen={setIsDrawerOpen} />
    </Card>
  );
}
