import { CalendarIcon } from 'lucide-react';
import moment, { type Moment } from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DASHBOARD_TIMEFRAME_OPTIONS, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Timeframe } from '@/types/global';

const YEAR_RANGE_START = 2015;

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

// Chip style shared by year and preset buttons in both strips
const chipClass = (active: boolean) =>
  cn(
    'h-5 shrink-0 px-1.5 text-2xs font-medium rounded-sm whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70',
  );

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
      clearDebounce();
    }
  }, [isOpen, committed, clearDebounce]);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  const displayLabel = useMemo(
    () => `${after.format(MOMENT_DATEPICKER_FORMAT)} - ${before.format(MOMENT_DATEPICKER_FORMAT)}`,
    [after, before],
  );

  const hint = useMemo(() => {
    if (!draft.from) return 'Select start date';
    if (!draft.to) return 'Select end date';
    return `${moment(draft.from).format(MOMENT_DATEPICKER_FORMAT)} - ${moment(draft.to).format(MOMENT_DATEPICKER_FORMAT)}`;
  }, [draft.from, draft.to]);

  const years = useMemo(() => {
    const result: number[] = [];
    for (let y = moment().year(); y >= YEAR_RANGE_START; y--) {
      result.push(y);
    }
    return result;
  }, []);

  const activeYear = useMemo(() => {
    if (!draft.from || !draft.to) return null;
    const f = moment(draft.from);
    const t = moment(draft.to);
    const sameYear = f.year() === t.year();
    const isFullYear =
      f.isSame(moment({ year: f.year() }).startOf('year'), 'day') &&
      t.isSame(moment({ year: t.year() }).endOf('year'), 'day');
    return sameYear && isFullYear ? f.year() : null;
  }, [draft.from, draft.to]);

  const isPresetActive = useCallback(
    (range: Timeframe) => {
      if (!draft.from || !draft.to) return false;
      return moment(draft.from).isSame(range.after, 'day') && moment(draft.to).isSame(range.before, 'day');
    },
    [draft.from, draft.to],
  );

  const onRangeSelect = useCallback(
    (range: DraftRange | undefined) => {
      const next: DraftRange = { from: range?.from, to: range?.to };
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
      const next: DraftRange = { from, to };
      setDraft(next);
      onChange({ after: moment(from).startOf('day'), before: moment(to).endOf('day') });
      // close after preset on mobile — drawer doesn't light-dismiss like a popover
      if (isMobile) setIsOpen(false);
    },
    [clearDebounce, isMobile, onChange],
  );

  const applyYearPreset = useCallback(
    (year: number) => {
      clearDebounce();
      const from = moment({ year }).startOf('year').toDate();
      const to = moment({ year }).endOf('year').toDate();
      const next: DraftRange = { from, to };
      setDraft(next);
      onChange({ after: moment(from).startOf('day'), before: moment(to).endOf('day') });
      if (isMobile) setIsOpen(false);
    },
    [clearDebounce, isMobile, onChange],
  );

  const trigger = children ?? (
    <Button id={id} variant="outline" className={className}>
      <CalendarIcon className="mr-2 h-4 w-4" />
      <span>{displayLabel}</span>
    </Button>
  );

  const numberOfMonths = isMobile ? 1 : 2;
  const selectedRange = draft.from ? { from: draft.from, to: draft.to } : undefined;

  const calendarContent = (
    <div className="flex flex-col">
      {/* Year strip — w-0 min-w-full so the Calendar (not the chips) sets popover width */}
      <div className="w-0 min-w-full overflow-x-auto border-b flex items-center gap-0.5 px-1.5 py-1">
        {years.map((year) => (
          <button
            aria-pressed={activeYear === year}
            type="button"
            className={chipClass(activeYear === year)}
            key={year}
            onClick={() => applyYearPreset(year)}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Preset strip — same sizing trick */}
      <div className="w-0 min-w-full overflow-x-auto border-b flex items-center gap-0.5 px-1.5 py-1">
        {presets.map(({ label, range }) => (
          <button
            aria-pressed={isPresetActive(range)}
            type="button"
            className={chipClass(isPresetActive(range))}
            key={label}
            onClick={() => applyPreset(range)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <Calendar
        initialFocus
        defaultMonth={draft.from ?? after.toDate()}
        mode="range"
        numberOfMonths={numberOfMonths}
        selected={selectedRange}
        onSelect={onRangeSelect}
      />

      {/* Selection hint */}
      <div aria-live="polite" className="border-t border-border/30 min-h-5 px-3 pb-2 pt-1.5 font-mono text-2xs text-muted-foreground/70">
        {hint}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Select date range</DrawerTitle>
            <DrawerDescription className="sr-only">Choose a start and end date, or select a preset range</DrawerDescription>
          </DrawerHeader>
          {calendarContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        {calendarContent}
      </PopoverContent>
    </Popover>
  );
};

export default DaterangePickerWithPresets;
