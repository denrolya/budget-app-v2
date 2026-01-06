import { ResponsiveBar } from '@nivo/bar';
import { useCallback, useRef, useState } from 'react';

import MonthDataDrawer from '@/features/sandbox/components/MonthDataDrawer.example';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const monthlyData = [
  { month: 'Jan', income: 5000, expenses: 4000 },
  { month: 'Feb', income: 5500, expenses: 4200 },
  { month: 'Mar', income: 6000, expenses: 4500 },
  { month: 'Apr', income: 5800, expenses: 4300 },
  { month: 'May', income: 6200, expenses: 4800 },
  { month: 'Jun', income: 6500, expenses: 5000 },
  { month: 'Jul', income: 7000, expenses: 5200 },
  { month: 'Aug', income: 7200, expenses: 5500 },
  { month: 'Sep', income: 6800, expenses: 5100 },
  { month: 'Oct', income: 7500, expenses: 5800 },
  { month: 'Nov', income: 7800, expenses: 6000 },
  { month: 'Dec', income: 8500, expenses: 6500 },
];

// Sample detailed data (you would replace this with real data in a production app)
const getDetailedData = (month: string) => [
  { category: 'Salary', amount: 5000, type: 'Income' },
  { category: 'Freelance', amount: 1500, type: 'Income' },
  { category: 'Rent', amount: 1500, type: 'Expense' },
  { category: 'Groceries', amount: 500, type: 'Expense' },
  { category: 'Utilities', amount: 300, type: 'Expense' },
  { category: 'Entertainment', amount: 200, type: 'Expense' },
];

export default function Component() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [tooltipContent, setTooltipContent] = useState<{
    month: string;
    income: number;
    expenses: number;
  } | null>(null);
  const lastTap = useRef(0);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleInteraction = useCallback(
    (data: { indexValue: string; data: { month: string; income: number; expenses: number } }) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300; // ms

      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        // Double tap detected
        setSelectedMonth(data.indexValue);
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
          setTooltipContent(data.data);
        }, 100);
      }

      lastTap.current = now;
    },
    [],
  );

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Yearly Income and Expenses</CardTitle>
        <CardDescription>
          Double-click (desktop) or double-tap (mobile) on a bar for detailed information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Tooltip open={!!tooltipContent}>
            <TooltipTrigger asChild>
              <div className="h-[400px]">
                <ResponsiveBar
                  data={monthlyData}
                  keys={['income', 'expenses']}
                  indexBy="month"
                  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={['hsl(var(--chart-1))', 'hsl(var(--chart-2))']}
                  borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Month',
                    legendPosition: 'middle',
                    legendOffset: 32,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Amount',
                    legendPosition: 'middle',
                    legendOffset: -40,
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  legends={[
                    {
                      dataFrom: 'keys',
                      anchor: 'bottom-right',
                      direction: 'column',
                      justify: false,
                      translateX: 120,
                      translateY: 0,
                      itemsSpacing: 2,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemDirection: 'left-to-right',
                      itemOpacity: 0.85,
                      symbolSize: 20,
                      effects: [
                        {
                          on: 'hover',
                          style: {
                            itemOpacity: 1,
                          },
                        },
                      ],
                    },
                  ]}
                  role="application"
                  ariaLabel="Yearly income and expenses chart"
                  barAriaLabel={(e) => `${e.id}: ${e.formattedValue} in month: ${e.indexValue}`}
                  onClick={handleInteraction}
                  onDoubleClick={(data) => {
                    setSelectedMonth(data.indexValue);
                    setIsDrawerOpen(true);
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {tooltipContent && (
                <div>
                  <p className="font-bold">{tooltipContent.month}</p>
                  <p>Income: ${tooltipContent.income}</p>
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
