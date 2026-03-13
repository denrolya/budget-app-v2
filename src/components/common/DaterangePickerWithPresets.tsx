import { CalendarIcon } from 'lucide-react';
import moment, { type Moment } from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DASHBOARD_TIMEFRAME_OPTIONS, MOMENT_DATEPICKER_FORMAT, type PresetOption } from '@/constants/datetime';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Timeframe } from '@/types/global';

const YEAR_START = 2010;
const YEARS = Array.from(
  { length: new Date().getFullYear() - YEAR_START + 1 },
  (_, i) => new Date().getFullYear() - i,
);

interface Props {
  id?: string;
  after: Moment;
  before: Moment;
  onChange: (timeframe: Timeframe) => void;
  presets?: PresetOption[];
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

  const committed = useMemo<DateRange>(() => ({ from: after.toDate(), to: before.toDate() }), [after, before]);
  const [draft, setDraft] = useState<DateRange>(committed);
  const [displayMonth, setDisplayMonth] = useState<Date>(() => committed.from ?? after.toDate());

  const debounceRef = useRef<number | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const scheduleCommit = useCallback(
    (next: DateRange) => {
      clearDebounce();
      if (!next.from || !next.to) return;
      debounceRef.current = window.setTimeout(() => {
        onChange({ after: moment(next.from).startOf('day'), before: moment(next.to!).endOf('day') });
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
    () => `${after.format(MOMENT_DATEPICKER_FORMAT)} – ${before.format(MOMENT_DATEPICKER_FORMAT)}`,
    [after, before],
  );

  const onSelect = useCallback(
    (range: DateRange | undefined) => {
      const next: DateRange = { from: range?.from, to: range?.to };
      setDraft(next);
      scheduleCommit(next);
    },
    [scheduleCommit],
  );

  const applyPreset = useCallback(
    (range: Timeframe) => {
      clearDebounce();
      const from = range.after.clone().startOf('day').toDate();
      const to = range.before.clone().endOf('day').toDate();
      const next: DateRange = { from, to };
      setDraft(next);
      setDisplayMonth(from);
      onChange({ after: moment(from).startOf('day'), before: moment(to).endOf('day') });
    },
    [clearDebounce, onChange],
  );

  const jumpToYear = useCallback(
    (year: number) => setDisplayMonth((prev) => new Date(year, prev.getMonth(), 1)),
    [],
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

      <PopoverContent align="start" className="w-auto p-0 flex overflow-hidden">
        <Calendar
          autoFocus
          mode="range"
          month={displayMonth}
          numberOfMonths={isMobile ? 1 : 2}
          selected={draft}
          onSelect={onSelect}
          onMonthChange={setDisplayMonth}
        />

        {/* Sidebar: year jump + presets — height capped to calendar */}
        <div className="border-l flex flex-col w-36 divide-y divide-border overflow-hidden max-h-[350px]">
          <div className="p-2 shrink-0">
            <p className="text-2xs font-medium uppercase tracking-widest text-muted-foreground mb-1.5">Year</p>
            <div className="flex flex-col gap-0.5 max-h-28 overflow-y-auto">
              {YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => jumpToYear(year)}
                  className={cn(
                    'text-left px-1.5 py-0.5 rounded text-xs',
                    displayMonth.getFullYear() === year
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 flex flex-col min-h-0 flex-1">
            <p className="text-2xs font-medium uppercase tracking-widest text-muted-foreground mb-1.5 shrink-0">Presets</p>
            <div className="flex flex-col gap-0.5 overflow-y-auto min-h-0 flex-1">
              {presets.map(({ label, range }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => applyPreset(range)}
                  className="text-left px-1.5 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DaterangePickerWithPresets;
