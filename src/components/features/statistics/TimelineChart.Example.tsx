// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimelineStatistics } from '@/hooks/statistics/useTimelineStatisticsRequest';
import { Type as TransactionType } from '@/types/transaction';
// @ts-nocheck
import { ResponsiveLine, Serie } from '@nivo/line';
import debounce from 'lodash/debounce';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

type Period = 'P1D' | 'P1W' | 'P1M' | 'P1Y'

const periodOptions: { value: Period; label: string }[] = [
  { value: 'P1D', label: 'Daily' },
  { value: 'P1W', label: 'Weekly' },
  { value: 'P1M', label: 'Monthly' },
  { value: 'P1Y', label: 'Yearly' },
];

interface ChartDataPoint {
  x: Date;
  y: number;
  originalDate: string;
}

interface TooltipProps {
  point: {
    serieId: string;
    serieColor: string;
    data: ChartDataPoint;
  };
  serie: Serie;
}

const CustomTooltip: React.FC<TooltipProps> = ({ point, serie }) => {
  const currentValue = point.data.y;
  const serieData = serie.data as ChartDataPoint[];
  const currentIndex = serieData.findIndex(d => d.x.getTime() === point.data.x.getTime());
  const previousValue = currentIndex > 0 ? serieData[currentIndex - 1].y : null;
  const change = previousValue !== null ? ((currentValue - previousValue) / previousValue) * 100 : null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 text-sm border border-gray-200 dark:border-gray-700">
      <div className="font-bold mb-2 text-gray-800 dark:text-gray-200">
        {moment(point.data.originalDate).format('MMMM D, YYYY')}
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium" style={{ color: point.serieColor }}>{point.serieId}</span>
        <span className="text-gray-700 dark:text-gray-300">${currentValue.toFixed(2)}</span>
      </div>
      {change !== null && (
        <div className={`mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? <ArrowUpIcon className="inline w-4 h-4 mr-1" /> :
            <ArrowDownIcon className="inline w-4 h-4 mr-1" />}
          {Math.abs(change).toFixed(1)}% from previous
        </div>
      )}
    </div>
  );
};

const professionalColors = [
  '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
  '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
];

export default function CategoryTimelineChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('P1M');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([1, 80, 3]);
  const [debouncedCategories, setDebouncedCategories] = useState<number[]>(selectedCategories);

  const { data, isLoading, error, refetch } = useTimelineStatistics({
    after: moment().subtract(2, 'year'),
    before: moment(),
    period: selectedPeriod,
    categories: debouncedCategories,
  }, [selectedPeriod, debouncedCategories]);

  const chartData = useMemo(() => {
    if (!data) return [];

    return Object.entries(data).map(([category, values]) => ({
      id: category,
      data: values
        .filter(item => item.date && moment(item.date).isValid() && !isNaN(item.value))
        .map(item => ({
          x: moment(item.date).toDate(),
          y: item.value,
          originalDate: item.date,
        })),
    })).filter(series => series.data.length > 0);
  }, [data]);

  const debouncedSetCategories = useCallback(
    debounce((newCategories: number[]) => {
      setDebouncedCategories(newCategories);
    }, 1000),
    [],
  );

  useEffect(() => {
    debouncedSetCategories(selectedCategories);
  }, [selectedCategories, debouncedSetCategories]);

  const handlePeriodChange = (value: Period) => {
    setSelectedPeriod(value);
    refetch();
  };

  const handleCategoriesChange = (newCategories: number[]) => {
    setSelectedCategories(newCategories);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CategoryTypeahead
          multiple
          valueField="id"
          value={selectedCategories}
          onChange={handleCategoriesChange}
          type={TransactionType.Expense}
        />
      </div>
      <div className="h-[400px] relative" aria-live="polite">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-500 dark:text-red-400">Error: {error.message}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No data available for the selected period and categories.
            </p>
          </div>
        ) : (
          <ResponsiveLine
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 30, left: 0 }}
            xScale={{
              type: 'time',
              format: 'native',
              precision: 'day',
            }}
            xFormat="time:%Y-%m-%d"
            yScale={{
              type: 'linear',
              min: 'auto',
              max: 'auto',
              stacked: false,
              reverse: false,
            }}
            axisBottom={{
              format: (value) => {
                const date = new Date(value);
                return selectedPeriod === 'P1D' ? date.getDate().toString() :
                  selectedPeriod === 'P1W' ? `W${moment(date).isoWeek()}` :
                    selectedPeriod === 'P1M' ? moment(date).format('MMM') :
                      moment(date).format('YYYY');
              },
              tickValues: 5,
              tickSize: 0,
              tickPadding: 10,
            }}
            axisLeft={null}
            enableGridX={false}
            enableGridY={false}
            enablePoints={false}
            enableSlices="x"
            curve="monotoneX"
            useMesh={true}
            theme={{
              axis: {
                ticks: { text: { fontSize: 12, fill: 'var(--chart-text-color)' } },
                domain: { line: { stroke: 'transparent' } },
              },
              crosshair: {
                line: {
                  stroke: 'var(--chart-crosshair-color)',
                  strokeWidth: 1,
                  strokeOpacity: 0.75,
                  strokeDasharray: '6 6',
                },
              },
              tooltip: {
                container: {
                  background: 'var(--chart-tooltip-background)',
                  color: 'var(--chart-tooltip-text-color)',
                  fontSize: 12,
                },
              },
            }}
            colors={professionalColors}
            lineWidth={2}
            tooltip={({ point }) => (
              <CustomTooltip point={point} serie={chartData.find(d => d.id === point.serieId) as Serie} />
            )}
            role="img"
            ariaLabel="Category expenses timeline chart"
          />
        )}
      </div>
    </>
  );
}
