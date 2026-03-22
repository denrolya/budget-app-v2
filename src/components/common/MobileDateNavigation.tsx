import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment, { type Moment } from 'moment';
import React, { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import type { Timeframe } from '@/types/global';

interface Props {
  after: Moment;
  before: Moment;
  onChange: (timeframe: Timeframe) => void;
  className?: string;
}

const toInputValue = (m: Moment) => m.format('YYYY-MM-DD');

const MobileDateNavigation: React.FC<Props> = ({ after, before, onChange, className }) => {
  const rangeDays = Math.max(1, before.diff(after, 'days') + 1);

  const shift = useCallback(
    (direction: -1 | 1) => {
      onChange({
        after: after
          .clone()
          .add(direction * rangeDays, 'days')
          .startOf('day'),
        before: before
          .clone()
          .add(direction * rangeDays, 'days')
          .endOf('day'),
      });
    },
    [after, before, rangeDays, onChange],
  );

  const handleFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (!value) return;
      const next = moment(value).startOf('day');
      if (next.isValid()) {
        onChange({ after: next, before: next.isAfter(before) ? next.clone().endOf('day') : before });
      }
    },
    [before, onChange],
  );

  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (!value) return;
      const next = moment(value).endOf('day');
      if (next.isValid()) {
        onChange({ after: next.isBefore(after) ? next.clone().startOf('day') : after, before: next });
      }
    },
    [after, onChange],
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <Button
          aria-label="Previous period"
          size="icon"
          type="button"
          variant="ghost"
          className="h-9 w-9 shrink-0"
          onClick={() => shift(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <input
          aria-label="From date"
          type="date"
          value={toInputValue(after)}
          className="h-9 rounded-md border bg-background px-1.5 text-xs tabular-nums w-[7.5rem]"
          onChange={handleFromChange}
        />

        <span className="text-2xs text-muted-foreground">–</span>

        <input
          aria-label="To date"
          type="date"
          value={toInputValue(before)}
          className="h-9 rounded-md border bg-background px-1.5 text-xs tabular-nums w-[7.5rem]"
          onChange={handleToChange}
        />

        <Button
          aria-label="Next period"
          size="icon"
          type="button"
          variant="ghost"
          className="h-9 w-9 shrink-0"
          onClick={() => shift(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MobileDateNavigation;
