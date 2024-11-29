import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment/moment';
import React, { useCallback, useEffect, useState } from 'react';

import Chart from '@/components/features/statistics/CategoriesTimeline/Chart';
import ConfigurationMenu from '@/components/features/statistics/CategoriesTimeline/ConfigurationMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimelineStatistics } from '@/hooks/statistics/useTimelineStatisticsRequest';
import { cn } from '@/lib/utils';
import { ISO8601Period } from '@/types/global';

export const CategoriesTimelineCard: React.FC<React.ComponentPropsWithoutRef<'div'>> = ({ className }) => {
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
    console.log(selectedCategories);
    debouncedSetCategories(selectedCategories);
  }, [selectedCategories, debouncedSetCategories]);

  return (
    <Card className={cn('mb-6', className)}>
      <CardHeader className="p-4 space-y-0.2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium">Categories Timeline</CardTitle>
          <ConfigurationMenu
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
        {isLoading && <Skeleton className="h-[450px] w-full" />}
        {!isLoading && !error && data && (
          <Chart data={data} selectedPeriod={selectedPeriod} />
        )}
      </CardContent>
    </Card>
  );
};

export default CategoriesTimelineCard;
