import moment from 'moment';
import { useCallback, useState } from 'react';

import { TIMEFRAME_STEP_PRESETS } from '@/app/daily-ledger/constants';
import { Timeframe, TimeframeStep } from '@/types/global';

const DEFAULT_STEP: TimeframeStep = TIMEFRAME_STEP_PRESETS[1]; // 1 week
const DEFAULT_TIMEFRAME: Timeframe = {
  after: moment().subtract(DEFAULT_STEP.amount, DEFAULT_STEP.unit),
  before: moment(),
};

interface UseTimeframeProps {
  onChange: (timeframe: Timeframe) => void;
}

export const useTimeframe = ({ onChange }: UseTimeframeProps) => {
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME);
  const [step, setStep] = useState<TimeframeStep>(DEFAULT_STEP);

  const goToPeriod = useCallback(
    (direction: 'next' | 'previous') => {
      const sign = direction === 'next' ? 1 : -1;

      const newBefore = timeframe.before.clone().add(sign * step.amount, step.unit);
      const newAfter = newBefore.clone().subtract(step.amount, step.unit);

      setTimeframe({ after: newAfter, before: newBefore });
      onChange({ after: newAfter, before: newBefore });
    },
    [timeframe, step],
  );

  const goToNextPeriod = () => goToPeriod('next');
  const goToPreviousPeriod = () => goToPeriod('previous');

  const reset = useCallback(() => {
    setTimeframe(DEFAULT_TIMEFRAME);
    setStep(DEFAULT_STEP);
  }, []);

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
