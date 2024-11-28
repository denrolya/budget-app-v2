import cn from 'classnames';
import { ArrowDownCircle, ArrowUpCircle, CalendarIcon, SettingsIcon } from 'lucide-react';
import moment, { Moment } from 'moment/moment';
import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';

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
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FILTER_PRESETS, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Type as TransactionType } from '@/types/transaction';


interface UnifiedChartMenuProps {
  type: TransactionType,
  setType: (type: TransactionType) => void,
  timeframe: { after: Moment, before: Moment },
  setTimeframe: (timeframe: { after: Moment, before: Moment }) => void,
}

export const UnifiedChartMenu: React.FC<UnifiedChartMenuProps> = ({ type, setType, timeframe, setTimeframe }) => {
  const isDesktop = useScreenSize();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setTimeframe({
        after: moment(range.from),
        before: moment(range.to),
      });
    }
    setIsDatePopoverOpen(false);
  };

  const MenuContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={type === TransactionType.Expense ? 'default' : 'outline'}
            className={cn('w-full justify-start space-x-2', {
              'bg-primary text-primary-foreground': type === TransactionType.Expense,
            })}
            onClick={() => setType(TransactionType.Expense)}
          >
            <ArrowUpCircle className="h-4 w-4" />
            <span>Expense</span>
          </Button>
          <Button
            type="button"
            variant={type === TransactionType.Income ? 'default' : 'outline'}
            className={cn('w-full justify-start space-x-2', {
              'bg-primary text-primary-foreground': type === TransactionType.Income,
            })}
            onClick={() => setType(TransactionType.Income)}
          >
            <ArrowDownCircle className="h-4 w-4" />
            <span>Income</span>
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Timeframe</Label>
        <div className="flex flex-wrap gap-2">
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button id="date-range" variant="outline" className="w-[260px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>
                  {timeframe.after.format(MOMENT_DATEPICKER_FORMAT)} - {timeframe.before.format(MOMENT_DATEPICKER_FORMAT)}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={timeframe.after.toDate()}
                selected={{
                  from: timeframe.after.toDate(),
                  to: timeframe.before.toDate(),
                }}
                onSelect={handleDateRangeChange}
                numberOfMonths={isDesktop ? 2 : 1}
              />
              <div className="p-3 space-y-3">
                <h4 className="font-medium text-sm">Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FILTER_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      size="sm"
                      variant="outline"
                      className="w-full justify-start text-left text-xs"
                      onClick={() => handleDateRangeChange(preset.range)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
            <SettingsIcon className="h-4 w-4" />
            <span className="sr-only">Open settings</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3">
          <MenuContent />
        </PopoverContent>
      </Popover>
    );
  } else {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="p-6">
          <DrawerHeader>
            <DrawerTitle>Chart Options</DrawerTitle>
            <DrawerDescription className="sr-only">MoneyFlow configuration</DrawerDescription>
          </DrawerHeader>
          <MenuContent />
        </DrawerContent>
      </Drawer>
    );
  }
};

export default UnifiedChartMenu;
