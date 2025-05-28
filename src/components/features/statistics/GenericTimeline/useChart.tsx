import moment, { Moment } from 'moment';
import { useState } from 'react';

import { PERIOD_OPTIONS, TIMEFRAME_OPTIONS } from '@/constants/datetime';
import { ISO8601Period, TimeframeValue } from '@/types/global';

type ChartType = 'line' | 'bar';

interface ChartUIStateOptions<Toggles extends string = never> {
  defaultChartType?: ChartType;
  defaultPeriod?: ISO8601Period;
  defaultTimeframeValue?: TimeframeValue;
  defaultTimeframeRange?: { after: Moment; before: Moment };
  defaultToggles?: Partial<Record<Toggles, boolean>>;
}

export const useChart = <Toggles extends string = never>(
  options: ChartUIStateOptions<Toggles> = {},
) => {
  const {
    defaultChartType = 'bar',
    defaultPeriod = PERIOD_OPTIONS[2].value,
    defaultTimeframeValue = TIMEFRAME_OPTIONS[6].value,
    defaultTimeframeRange,
    defaultToggles = {},
  } = options;

  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [period, setPeriod] = useState<ISO8601Period>(defaultPeriod);
  const [timeframe, setTimeframe] = useState<TimeframeValue>(defaultTimeframeValue);
  const [timeframeRange, setTimeframeRange] = useState(
    defaultTimeframeRange || {
      after: moment().subtract(1, 'year').startOf('year'),
      before: moment(),
    },
  );

  const [toggles, setToggles] = useState<Partial<Record<Toggles, boolean>>>(
    defaultToggles,
  );

  const setToggle = (key: Toggles, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  return {
    chartType,
    setChartType,
    period,
    setPeriod,
    timeframe,
    setTimeframe,
    timeframeRange,
    setTimeframeRange,
    toggles,
    setToggle,
  };
};
