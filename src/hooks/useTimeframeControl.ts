import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';

import { PERIOD_OPTIONS } from '@/constants/datetime';
import { ISO8601Period, Timeframe, TimeframeOption, PeriodOption } from '@/types/global';

export interface UseTimeframeControlOptions {
  defaultPreset?: string;
  defaultTimeframe?: Timeframe;
  defaultPeriod?: ISO8601Period;
  presets?: TimeframeOption[];
  enablePreviousTimeframe?: boolean;
  enablePeriod?: boolean;
}

const getPeriodDuration = (period: ISO8601Period): moment.Duration => {
  switch (period) {
    case 'P1D':
      return moment.duration(1, 'day');
    case 'P1W':
      return moment.duration(1, 'week');
    case 'P1M':
      return moment.duration(1, 'month');
    case 'P3M':
      return moment.duration(3, 'months');
    case 'P6M':
      return moment.duration(6, 'months');
    case 'P1Y':
      return moment.duration(1, 'year');
    default:
      return moment.duration(0);
  }
};

export const useTimeframeControl = ({
                                      defaultPreset,
                                      defaultTimeframe,
                                      defaultPeriod = 'P1M',
                                      presets = [],
                                      enablePreviousTimeframe = false,
                                      enablePeriod = false,
                                    }: UseTimeframeControlOptions) => {
  const [preset, setPresetInternal] = useState<string | undefined>(defaultPreset);
  const [manualTimeframe, setManualTimeframe] = useState<Timeframe | undefined>(defaultTimeframe);
  const [period, setPeriodInternal] = useState<ISO8601Period>(defaultPeriod);

  const selectedPreset = useMemo(() => presets.find(p => p.value === preset), [preset, presets]);

  const timeframe = useMemo<Timeframe>(() => {
    const now = moment();
    if (preset && selectedPreset) return selectedPreset.getDateRange(now);
    if (manualTimeframe) return manualTimeframe;

    return {
      after: now.clone().subtract(1, 'month').startOf('month'),
      before: now.clone().endOf('month'),
    };
  }, [preset, selectedPreset, manualTimeframe]);

  const timeframeDuration = useMemo(
    () => moment.duration(timeframe.before.diff(timeframe.after)),
    [timeframe],
  );

  const availablePeriods: PeriodOption[] = useMemo(
    () =>
      PERIOD_OPTIONS.filter(p =>
        getPeriodDuration(p.value).asMilliseconds() <= timeframeDuration.asMilliseconds(),
      ),
    [timeframeDuration],
  );

  useEffect(() => {
    if (enablePeriod && !availablePeriods.find(p => p.value === period)) {
      const fallback = availablePeriods.at(-1);
      if (fallback) setPeriodInternal(fallback.value);
    }
  }, [enablePeriod, period, availablePeriods]);

  const previousTimeframe = useMemo<Timeframe | undefined>(() => {
    if (!enablePreviousTimeframe) return undefined;

    switch (preset) {
      case 'WTD':
        return {
          after: timeframe.after.clone().subtract(1, 'week').startOf('isoWeek'),
          before: timeframe.after.clone().subtract(1, 'week').endOf('isoWeek'),
        };
      case 'MTD':
        return {
          after: timeframe.after.clone().subtract(1, 'month').startOf('month'),
          before: timeframe.after.clone().subtract(1, 'month').endOf('month'),
        };
      case 'YTD':
        return {
          after: timeframe.after.clone().subtract(1, 'year').startOf('year'),
          before: timeframe.after.clone().subtract(1, 'year').endOf('year'),
        };
      default: {
        const duration = moment.duration(timeframe.before.diff(timeframe.after));
        return {
          after: timeframe.after.clone().subtract(duration),
          before: timeframe.after.clone().subtract(1, 'second'),
        };
      }
    }
  }, [enablePreviousTimeframe, preset, timeframe]);

  const setPreset = (newPreset?: string) => {
    setManualTimeframe(undefined);
    setPresetInternal(newPreset);
  };

  const setTimeframe = (tf: Timeframe) => {
    setManualTimeframe(tf);
    setPresetInternal(undefined);
  };

  return {
    timeframe,
    setTimeframe,
    preset,
    setPreset,
    ...(enablePreviousTimeframe && {
      previousTimeframe,
    }),
    ...(enablePeriod && {
      period,
      setPeriod: (p: ISO8601Period) => setPeriodInternal(p),
      availablePeriods,
    }),
  };
};
