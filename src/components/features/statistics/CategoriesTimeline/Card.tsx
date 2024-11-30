import moment from 'moment/moment';
import React, { useCallback, useEffect, useState } from 'react';

import Chart from '@/components/features/statistics/CategoriesTimeline/Chart';
import ConfigurationMenu from '@/components/features/statistics/CategoriesTimeline/ConfigurationMenu';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimelineStatistics } from '@/hooks/statistics/useTimelineStatisticsRequest';
import { cn } from '@/lib/utils';
import { ISO8601Period } from '@/types/global';

export const CategoriesTimelineCard: React.FC<React.ComponentPropsWithoutRef<'div'>> = ({ className }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedPeriod, setSelectedPeriod] = useState<ISO8601Period>('P1M');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([1, 25, 66]);
  const [debouncedCategories, setDebouncedCategories] = useState<number[]>(selectedCategories);
  const [timeframe, setTimeframe] = useState({
    after: moment().subtract(2, 'year'),
    before: moment(),
  });

  const { data, isLoading, error, refetch } = useTimelineStatistics({
    after: timeframe.after,
    before: timeframe.before,
    period: selectedPeriod,
    categories: debouncedCategories,
  }, [selectedPeriod, debouncedCategories]);

  const debouncedSetCategories = useCallback(
    (newCategories: number[]) => {
      const timeoutId = setTimeout(() => {
        setDebouncedCategories(newCategories);
      }, 1000);
      return () => clearTimeout(timeoutId);
    },
    [],
  );

  useEffect(() => {
    debouncedSetCategories(selectedCategories);
  }, [selectedCategories, debouncedSetCategories]);

  return (
    <Card className={cn('mb-6', className)}>
      <CardHeader className="p-4 space-y-0.2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium">Categories Timeline</CardTitle>
          <ConfigurationMenu
            chartType={chartType}
            setChartType={setChartType}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex-grow overflow-hidden flex flex-col mt-2">
          <div className="flex-grow overflow-x-auto overflow-y-hidden h-[390px]">
            {isLoading && <Skeleton className="h-full w-full" />}
            {!isLoading && !error && data && (
              <Chart chartType={chartType} data={data} selectedPeriod={selectedPeriod} />
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className={cn('flex flex-col gap-4 sm:gap-6 lg:flex-row lg:justify-between p-3 transition-all border-t duration-300 ease-in-out')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:flex-1 lg:grid-cols-4 w-full">

        </div>
      </CardFooter>
    </Card>
  );
};

export default CategoriesTimelineCard;
