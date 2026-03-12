import { CalendarIcon } from 'lucide-react';
import moment, { type Moment } from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DASHBOARD_TIMEFRAME_OPTIONS, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Timeframe } from '@/types/global';

type DraftRange = {
  from?: Date;
  to?: Date;
};

interface Props {
  id?: string;
  after: Moment;
  before: Moment;
  onChange: (timeframe: Timeframe) => void;
  presets?: { label: string; range: Timeframe }[];
  children?: React.ReactNode;
  className?: string;
  debounceMs?: number;
}

const DaterangePickerWithPresets: React.FC<Props> = ({
  id,
  after,
  before,
  onChange,
  presets = DASHBOARD_TIMEFRAME_OPTIONS,
  className,
  children,
  debounceMs = 350,
}) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const committed = useMemo<DraftRange>(() => ({ from: after.toDate(), to: before.toDate() }), [after, before]);
  const [draft, setDraft] = useState<DraftRange>(committed);

  // Controlled display month — ensures prev/next navigation always works
  // regardless of popover position, portals, or parent re-renders.
  const [displayMonth, setDisplayMonth] = useState<Date>(() => committed.from ?? after.toDate());

  const debounceRef = useRef<number | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const scheduleCommit = useCallback(
    (next: DraftRange) => {
      clearDebounce();

      if (!next.from || !next.to) return;

      debounceRef.current = window.setTimeout(() => {
        const nextAfter = moment(next.from).startOf('day');
        const nextBefore = moment(next.to).endOf('day');
        onChange({ after: nextAfter, before: nextBefore });
      }, debounceMs);
    },
    [clearDebounce, debounceMs, onChange],
  );

  useEffect(() => {
    if (isOpen) {
      setDraft(committed);
      setDisplayMonth(committed.from ?? after.toDate());
      clearDebounce();
    }
  }, [isOpen, committed, clearDebounce, after]);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  const displayLabel = useMemo(
    () => `${after.format(MOMENT_DATEPICKER_FORMAT)} - ${before.format(MOMENT_DATEPICKER_FORMAT)}`,
    [after, before],
  );

  const hint = useMemo(() => {
    if (!draft.from) return 'Select start date';
    if (draft.from && !draft.to) return 'Select end date';
    return `${moment(draft.from).format(MOMENT_DATEPICKER_FORMAT)} - ${moment(draft.to!).format(MOMENT_DATEPICKER_FORMAT)}`;
  }, [draft.from, draft.to]);

  const startNewSelection = useCallback(
    (day: Date) => {
      const next: DraftRange = { from: day, to: undefined };
      setDraft(next);
      clearDebounce();
    },
    [clearDebounce],
  );

  const setEndOrSwap = useCallback(
    (day: Date) => {
      if (!draft.from) {
        startNewSelection(day);
        return;
      }

      const fromTime = draft.from.getTime();
      const dayTime = day.getTime();

      if (!draft.to) {
        if (dayTime < fromTime) {
          // clicked before start -> move start
          startNewSelection(day);
          return;
        }

        // set end
        const next: DraftRange = { from: draft.from, to: day };
        setDraft(next);
        scheduleCommit(next);
        return;
      }

      // range already complete -> start new selection
      startNewSelection(day);
    },
    [draft.from, draft.to, scheduleCommit, startNewSelection],
  );

  const onDayClick = useCallback(
    (day: Date) => {
      setEndOrSwap(day);
    },
    [setEndOrSwap],
  );

  const applyPreset = useCallback(
    (range: Timeframe) => {
      clearDebounce();

      const from = range.after.clone().startOf('day').toDate();
      const to = range.before.clone().endOf('day').toDate();

      const next: DraftRange = { from, to };
      setDraft(next);
      setDisplayMonth(from);

      // presets should feel instant, not delayed
      onChange({ after: moment(from).startOf('day'), before: moment(to).endOf('day') });
    },
    [clearDebounce, onChange],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children ? (
          children
        ) : (
          <Button id={id} variant="outline" className={cn(className)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{displayLabel}</span>
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          initialFocus
          mode="range"
          month={displayMonth}
          numberOfMonths={isMobile ? 1 : 2}
          selected={draft.from ? { from: draft.from, to: draft.to } : undefined}
          onDayClick={onDayClick}
          onMonthChange={setDisplayMonth}
        />

        <div className="p-3 space-y-3">
          <div aria-live="polite" className="text-xs text-muted-foreground">
            {hint}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-primary">Presets</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {presets.map(({ label, range }) => (
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left text-xs"
                  key={label}
                  onClick={() => applyPreset(range)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DaterangePickerWithPresets;
