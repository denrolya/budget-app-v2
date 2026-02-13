import moment from 'moment';
import { useCallback, useState } from 'react';

import { TIMEFRAME_STEP_PRESETS } from '@/features/daily-ledger/constants';
import { Timeframe, TimeframeStep } from '@/types/global';

const DEFAULT_STEP: TimeframeStep = TIMEFRAME_STEP_PRESETS.find(
  (s) => s.unit === 'week',
) ?? TIMEFRAME_STEP_PRESETS[1];

const getInitialTimeframe = (step: TimeframeStep): Timeframe => {
  const now = moment();

  switch (step.unit) {
    case 'week':
      return {
        after: now.clone().startOf('isoWeek'),
        before: now.clone().endOf('isoWeek'),
      };

    case 'month':
      return {
        after: now.clone().startOf('month'),
        before: now.clone().endOf('month'),
      };

    case 'day':
    default:
      return {
        after: now.clone().startOf('day'),
        before: now.clone().endOf('day'),
      };
  }
};

interface UseTimeframeProps {
  onChange: (timeframe: Timeframe) => void;
}

export const useTimeframe = ({ onChange }: UseTimeframeProps) => {
  const [step, setStep] = useState<TimeframeStep>(DEFAULT_STEP);
  const [timeframe, setTimeframe] = useState<Timeframe>(
    getInitialTimeframe(DEFAULT_STEP),
  );

  const buildTimeframeFromStart = useCallback((start: moment.Moment, step: TimeframeStep): Timeframe => {
    switch (step.unit) {
      case 'week':
        return {
          after: start.clone().startOf('isoWeek'),
          before: start.clone().endOf('isoWeek'),
        };

      case 'month':
        return {
          after: start.clone().startOf('month'),
          before: start.clone().endOf('month'),
        };

      case 'day':
      default:
        return {
          after: start.clone().startOf('day'),
          before: start.clone().endOf('day'),
        };
    }
  }, []);

  const goToPeriod = useCallback(
    (direction: 'next' | 'previous') => {
      const sign = direction === 'next' ? 1 : -1;

      const base = timeframe.after.clone().add(sign * step.amount, step.unit);
      const next = buildTimeframeFromStart(base, step);

      setTimeframe(next);
      onChange(next);
    },
    [timeframe.after, step, buildTimeframeFromStart, onChange],
  );

  const goToNextPeriod = () => goToPeriod('next');
  const goToPreviousPeriod = () => goToPeriod('previous');

  const reset = useCallback(() => {
    const initial = getInitialTimeframe(step);
    setTimeframe(initial);
    onChange(initial);
  }, [step, onChange]);

  return {
    timeframe,
    setTimeframe,
    step,
    setStep,
    goToNextPeriod,
    goToPreviousPeriod,
    reset,
  };
};
