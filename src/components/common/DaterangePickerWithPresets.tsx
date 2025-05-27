import { CalendarIcon } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DASHBOARD_TIMEFRAME_OPTIONS, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';
import { Timeframe } from '@/types/global';

interface Props {
  id?: string;
  after: Moment;
  before: Moment;
  onChange: (timeframe: Timeframe) => void;
  presets?: { label: string; range: Timeframe }[];
  children?: React.ReactNode;
  className?: string;
}

const DaterangePickerWithPresets: React.FC<Props> = ({
  id,
  after,
  before,
  onChange,
  presets = DASHBOARD_TIMEFRAME_OPTIONS,
  className,
  children,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children ? (
          children
        ) : (
          <Button id={id} variant="outline" className={cn(className)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>
              {after.format(MOMENT_DATEPICKER_FORMAT)} - {before.format(MOMENT_DATEPICKER_FORMAT)}
            </span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={after.toDate()}
          selected={{
            from: after.toDate(),
            to: before.toDate(),
          }}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange({
                after: moment(range.from),
                before: moment(range.to),
              });
            }
          }}
          numberOfMonths={isMobile ? 1 : 2}
        />
        <div className="p-3 space-y-3">
          <h4 className="font-medium text-sm text-primary">Presets</h4>
          <div className="grid grid-cols-4 gap-1">
            {presets.map(({ label, range }) => (
              <Button
                key={label}
                size="sm"
                variant="outline"
                className="w-full justify-start text-left text-xs"
                onClick={() => onChange(range)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DaterangePickerWithPresets;
