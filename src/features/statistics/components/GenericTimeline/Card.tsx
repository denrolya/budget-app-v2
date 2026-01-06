// components/common/ChartCard.tsx
import React, { useState } from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PERIOD_OPTIONS, TIMEFRAME_OPTIONS } from '@/constants/datetime';
import { ISO8601Period, TimeframeValue } from '@/types/global';

interface ChartCardProps<T> {
  title: string;
  description?: string;
  chartType?: 'bar' | 'line';
  ChartComponent: React.FC<{ data: T }>;
  ConfigurationMenuComponent?: React.FC<{
    timeframe: TimeframeValue;
    period: ISO8601Period;
    setTimeframe: (val: TimeframeValue) => void;
    setPeriod: (val: ISO8601Period) => void;
  }>;
  SummaryComponent?: React.FC<{ data: T }>;
  useDataHook: (timeframe: TimeframeValue, period: ISO8601Period) => { data: T; isLoading: boolean; error?: any };
}

const ChartCard: React.FC<ChartCardProps<T>> = ({
                               title,
                               description,
                               chartType = 'bar',
                               ChartComponent,
                               ConfigurationMenuComponent,
                               SummaryComponent,
                               useDataHook,
                             }) => {
  const [timeframe, setTimeframe] = useState<TimeframeValue>(TIMEFRAME_OPTIONS[6].value);
  const [period, setPeriod] = useState<ISO8601Period>(PERIOD_OPTIONS[2].value);

  const { data, isLoading, error } = useDataHook(timeframe, period);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      {ConfigurationMenuComponent && (
        <ConfigurationMenuComponent
          timeframe={timeframe}
          period={period}
          setTimeframe={setTimeframe}
          setPeriod={setPeriod}
        />
      )}

      <CardContent>
        {isLoading ? (
          <div className="h-60 flex items-center justify-center">Loading...</div>
        ) : error ? (
          <div className="text-destructive">Error loading data</div>
        ) : (
          <ChartComponent data={data} />
        )}
      </CardContent>

      {SummaryComponent && (
        <CardFooter>
          <SummaryComponent data={data} />
        </CardFooter>
      )}
    </Card>
  );
}

export default ChartCard;
