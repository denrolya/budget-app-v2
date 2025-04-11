import { ResponsiveLine } from '@nivo/line';
import isEqual from 'lodash/isEqual';
import { SettingsIcon } from 'lucide-react';
import React, { memo, useMemo, useState } from 'react';

import ConfigContainer from '@/components/features/statistics/StatisticsCard/ConfigContainer';
import GenericContent from '@/components/features/statistics/StatisticsCard/GenericContent';
import MinMaxContent from '@/components/features/statistics/StatisticsCard/MinMaxContent';
import PercentageIndicator from '@/components/features/statistics/StatisticsCard/PercentageIndicator';
import StatTypeBadge from '@/components/features/statistics/StatisticsCard/StatTypeBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useValueByPeriod } from '@/hooks/statistics/useValueByPeriodStatistics';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Interval, StatisticsConfig, StatisticsType } from '@/types/statistics';
import { Type as TransactionType } from '@/types/transaction';
import { PercentageChange, StatisticsData, ValueByPeriodData } from '@/types/valueByPeriodStatistics';
import { generateSlug } from '@/utils/generateSlug';

interface Props {
  onChange: (newConfig: Partial<StatisticsConfig>) => void;
  config: StatisticsConfig;
}

const getPeriodText = (timeframe: Interval, period?: Interval): string => {
  if (period) {
    return `${timeframe.value} ${timeframe.unit}${timeframe.value > 1 ? 's' : ''} by ${period.value} ${period.unit}${period.value > 1 ? 's' : ''}`;
  }
  switch (timeframe.unit) {
    case 'day':
      return 'Today';
    case 'week':
      return 'This Week';
    case 'month':
      return 'This Month';
    case 'quarter':
      return 'This Quarter';
    case 'year':
      return 'This Year';
    default:
      return '';
  }
};

const StatisticsCardSkeleton = () => (
  <Card className="w-[300px] h-[140px] overflow-hidden transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 relative flex-none snap-center">
    <CardContent className="p-4">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px] mt-2" />
    </CardContent>
  </Card>
);

export const StatisticsCard: React.FC<Props> = ({ config, onChange }) => {
  const { title, type, categories, timeframe, period, comparison, statType } = config;
  const {
    currentData,
    comparisonData,
    currentValue,
    comparisonValue,
    percentageChange,
    isLoading,
    error,
    minDate,
    maxDate,
    selectedTimeframe,
    comparisonTimeframe,
  } = useValueByPeriod({ config }, [title, type, categories, timeframe, period, comparison, statType]);

  const id = useMemo(() => generateSlug([title, type, statType, comparison]), [title, type, statType, comparison]);

  const cardTitle = useMemo(
    () =>
      title || (categories?.length ? categories.join(', ') : type === TransactionType.Income ? 'Income' : 'Expenses'),
    [title, categories, type],
  );

  const periodText = useMemo(() => getPeriodText(timeframe, period), [timeframe, period]);
  const [open, setOpen] = useState(false);
  const isDesktop = useScreenSize();

  const chartData = useMemo(() => {
    if (statType !== StatisticsType.Avg || (!currentData && !comparisonData)) return null;

    const data = currentData || [];
    return [
      {
        id: type,
        data: data.map((item: ValueByPeriodData) => ({
          x: item.after.format('YYYY-MM-DD'),
          y: item[type],
        })),
      },
    ];
  }, [currentData, comparisonData, statType, type]);

  if (isLoading) {
    return <StatisticsCardSkeleton />;
  }

  return (
    <Card
      className="w-[300px] h-[140px] overflow-hidden transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 relative flex-none snap-center"
      id={id}
    >
      {chartData && (
        <div className="absolute inset-0 z-0 opacity-15">
          <ResponsiveLine
            data={chartData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            curve="natural"
            axisTop={null}
            axisRight={null}
            axisBottom={null}
            axisLeft={null}
            enableGridX={false}
            enableGridY={false}
            enablePoints={false}
            enableArea={true}
            areaOpacity={0.3}
            useMesh={false}
            colors={[`hsl(var(--${type === TransactionType.Income ? 'success' : 'destructive'}))`]}
            theme={{
              background: 'transparent',
            }}
          />
        </div>
      )}
      <CardContent className="p-4 flex flex-col justify-between h-full z-1 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-primary truncate">{cardTitle}</h3>
            <p className="text-xs text-muted-foreground">{periodText}</p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <StatTypeBadge type={statType} />
            <ConfigContainer open={open} setOpen={setOpen} title={config.title} onChange={onChange} config={config}>
              <Button variant="ghost" size="icon" className={isDesktop ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}>
                <SettingsIcon className="h-4 w-4" />
                <span className="sr-only">Open settings</span>
              </Button>
            </ConfigContainer>
          </div>
        </div>
        {error && <p className="text-destructive">Error loading data</p>}
        {!error && (
          <>
            <div className="space-y-1">
              {statType === StatisticsType.MinMax && (
                <MinMaxContent
                  currentValue={currentValue as StatisticsData<StatisticsType.MinMax>}
                  comparisonValue={comparisonValue as StatisticsData<StatisticsType.MinMax>}
                  percentageChange={percentageChange as PercentageChange<StatisticsType.MinMax>}
                  selectedTimeframe={selectedTimeframe}
                  comparisonTimeframe={comparisonTimeframe}
                  comparison={comparison}
                  type={type}
                  minDate={minDate}
                  maxDate={maxDate}
                />
              )}
              {statType !== StatisticsType.MinMax && (
                <GenericContent
                  currentValue={currentValue as StatisticsData<StatisticsType.Sum>}
                  comparisonValue={comparisonValue as StatisticsData<StatisticsType.Sum>}
                  percentageChange={percentageChange as PercentageChange<StatisticsType.Sum>}
                  selectedTimeframe={selectedTimeframe}
                  comparisonTimeframe={comparisonTimeframe}
                  comparison={comparison}
                  type={type}
                />
              )}
            </div>
            <PercentageIndicator percentageChange={percentageChange} type={type} statType={statType} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

StatisticsCard.displayName = 'StatisticsCard';

export default memo(StatisticsCard, (prevProps, nextProps) => isEqual(prevProps.config, nextProps.config));
