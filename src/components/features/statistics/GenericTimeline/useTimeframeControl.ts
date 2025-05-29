import moment, { Moment } from 'moment';
import { useEffect, useMemo, useState } from 'react';

import { ISO8601Period } from '@/types/global';

export interface Timeframe {
  after: Moment;
  before: Moment;
}

export interface Preset {
  label: string;
  value: string;
  getDateRange: (now: Moment) => Timeframe;
}

interface PeriodOption {
  label: string;
  value: ISO8601Period;
}

export interface UseTimeframeControlOptions {
  defaultPreset?: string;
  defaultTimeframe?: Timeframe;
  defaultPeriod?: ISO8601Period;
  presets?: Preset[];
  enablePreviousTimeframe?: boolean;
  enablePeriod?: boolean;
}

// Define supported periods and their durations
const PERIOD_OPTIONS: PeriodOption[] = [
  { label: '1 Day', value: 'P1D' },
  { label: '1 Week', value: 'P1W' },
  { label: '1 Month', value: 'P1M' },
  { label: '3 Months', value: 'P3M' },
  { label: '6 Months', value: 'P6M' },
  { label: '1 Year', value: 'P1Y' },
];

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
    setManualTimeframe(undefined); // clear manual override
    setPresetInternal(newPreset);
  };

  const setTimeframe = (tf: Timeframe) => {
    setManualTimeframe(tf);
    setPresetInternal(undefined); // clear preset override
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
