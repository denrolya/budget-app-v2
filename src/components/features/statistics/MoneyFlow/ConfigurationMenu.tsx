import { BarChart, LineChart, PieChart, SettingsIcon, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useScreenSize } from '@/hooks/useScreenSize';
import { TIMEFRAME_OPTIONS } from '@/constants/datetime';

interface UnifiedChartMenuProps {
  timeframe: string;
  setTimeframe: (value: string) => void;
  interval: string;
  setInterval: (value: string) => void;
  chartType: 'bar' | 'line';
  setChartType: (value: 'bar' | 'line') => void;
  showIncome: boolean;
  setShowIncome: (value: boolean) => void;
  showExpenses: boolean;
  setShowExpenses: (value: boolean) => void;
  showRevenue: boolean;
  setShowRevenue: (value: boolean) => void;
  showPreviousPeriod: boolean;
  setShowPreviousPeriod: (value: boolean) => void;
  availableIntervals: { value: string; label: string }[];
}

export const UnifiedChartMenu: React.FC<UnifiedChartMenuProps> = (props) => {
  const isDesktop = useScreenSize();

  const OptionButton = ({ value, label, currentValue, onChange }) => (
    <Button
      variant={currentValue === value ? 'default' : 'outline'}
      size="sm"
      onClick={() => onChange(value)}
      className="px-2 py-1 h-8 text-xs"
    >
      {label}
    </Button>
  );

  const MenuContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Timeframe</Label>
        <div className="flex flex-wrap gap-2">
          {TIMEFRAME_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              value={option.value}
              label={option.label}
              currentValue={props.timeframe}
              onChange={props.setTimeframe}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Interval</Label>
        <div className="flex flex-wrap gap-2">
          {props.availableIntervals.map((option) => (
            <OptionButton
              key={option.value}
              value={option.value}
              label={option.label}
              currentValue={props.interval}
              onChange={props.setInterval}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Chart Type</Label>
        <RadioGroup
          value={props.chartType}
          onValueChange={(value) => props.setChartType(value as 'bar' | 'line')}
          className="flex space-x-2"
        >
          {[
            { value: 'bar', label: 'Bar', icon: BarChart },
            { value: 'line', label: 'Line', icon: LineChart },
          ].map(({ value, label, icon: Icon }) => (
            <div key={value} className="flex items-center">
              <RadioGroupItem value={value} id={value} className="sr-only peer" />
              <Label
                htmlFor={value}
                className="flex items-center space-x-1 rounded-md px-2 py-1 text-xs cursor-pointer peer-checked:bg-primary peer-checked:text-primary-foreground hover:bg-muted"
              >
                <Icon className="h-3 w-3" />
                <span>{label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Display Options</Label>
        <div className="space-y-1">
          {[
            { id: 'income', label: 'Income', icon: TrendingUp, color: 'text-success' },
            { id: 'expenses', label: 'Expenses', icon: TrendingDown, color: 'text-destructive' },
            { id: 'revenue', label: 'Revenue', icon: PieChart, color: 'text-secondary' },
            { id: 'previous-period', label: 'Previous Period', icon: TrendingUp, color: 'text-muted-foreground' },
          ].map(({ id, label, icon: Icon, color }) => (
            <div key={id} className="flex items-center justify-between">
              <Label htmlFor={id} className="flex items-center space-x-2 text-xs cursor-pointer">
                <Icon className={`h-3 w-3 ${color}`} />
                <span>{label}</span>
              </Label>
              <Switch
                id={id}
                checked={
                  id === 'income' ? props.showIncome :
                    id === 'expenses' ? props.showExpenses :
                      id === 'revenue' ? props.showRevenue :
                        props.showPreviousPeriod
                }
                onCheckedChange={
                  id === 'income' ? props.setShowIncome :
                    id === 'expenses' ? props.setShowExpenses :
                      id === 'revenue' ? props.setShowRevenue :
                        props.setShowPreviousPeriod
                }
                className="scale-75"
              />
            </div>
          ))}
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
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3">
          <ScrollArea className="h-[calc(100vh-100px)]">
            <MenuContent />
          </ScrollArea>
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
