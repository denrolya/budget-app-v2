import moment from 'moment';

import { Timeframe } from '@/types/global';

export type TimeframePreset = {
  label: string;
  value: string;
  getTimeframe: () => Timeframe;
  step: {
    unit: moment.unitOfTime.DurationConstructor;
    amount: number;
  };
};
