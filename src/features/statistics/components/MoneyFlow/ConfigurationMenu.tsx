import { BarChart, CalendarX, LineChart, PieChart, SettingsIcon, TrendingDown, TrendingUp } from 'lucide-react';
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
import Switch from '@/features/statistics/components/MoneyFlow/ConfigurationMenuSwitch';
import { useIsMobile } from '@/hooks/use-mobile';
import { PeriodValue } from '@/types/global';

interface UnifiedChartMenuProps {
  period: string;
  setPeriod: (value: PeriodValue) => void;
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
  availablePeriods: { value: string; label: string }[];
  showYearBoundary: boolean;
  setShowYearBoundary: (value: boolean) => void;
  showMonthBoundary: boolean;
  setShowMonthBoundary: (value: boolean) => void;
  showSeasonBoundary: boolean;
  setShowSeasonBoundary: (value: boolean) => void;
}

interface OptionButtonProps {
  value: string;
  label: string;
  currentValue: string;
  onChange: (value: any) => void;
}

export const UnifiedChartMenu: React.FC<UnifiedChartMenuProps> = (props) => {
  const isMobile = useIsMobile();

  const OptionButton: React.FC<OptionButtonProps> = ({ value, label, currentValue, onChange }) => (
    <Button
      size="sm"
      variant={currentValue === value ? 'default' : 'outline'}
      className="px-2 py-1 h-8 text-xs"
      onClick={() => onChange(value)}
    >
      {label}
    </Button>
  );

  const MenuContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Period</Label>
        <div className="flex flex-wrap gap-2">
          {props.availablePeriods.map((option) => (
            <OptionButton
              currentValue={props.period}
              label={option.label}
              value={option.value}
              key={option.value}
              onChange={props.setPeriod}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Chart Type</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={props.chartType === 'line' ? 'default' : 'outline'}
            className="flex items-center px-2 py-1 space-x-1"
            onClick={() => props.setChartType('line')}
          >
            <LineChart className="h-4 w-4" />
            Line
          </Button>
          <Button
            variant={props.chartType === 'bar' ? 'default' : 'outline'}
            className="flex items-center px-2 py-1 space-x-1"
            onClick={() => props.setChartType('bar')}
          >
            <BarChart className="h-4 w-4" />
            Bar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Display Options</Label>
        <div className="space-y-1">
          {[
            { id: 'income', label: 'Income', icon: TrendingUp, color: 'text-success' },
            { id: 'expenses', label: 'Expenses', icon: TrendingDown, color: 'text-destructive' },
            { id: 'revenue', label: 'Revenue', icon: PieChart, color: 'text-secondary' },
            { id: 'previous-period', label: 'Previous Period', icon: TrendingUp, color: 'text-muted-foreground' },
          ].map(({ id, label, icon, color }) => (
            <Switch
              icon={icon}
              label={label}
              checked={id === 'income'
                ? props.showIncome
                : id === 'expenses'
                  ? props.showExpenses
                  : id === 'revenue'
                    ? props.showRevenue
                    : props.showPreviousPeriod}
              iconClassName={color}
              key={id}
              onChange={id === 'income'
                ? props.setShowIncome
                : id === 'expenses'
                  ? props.setShowExpenses
                  : id === 'revenue'
                    ? props.setShowRevenue
                    : props.setShowPreviousPeriod} />
          ))}

          <Switch
            checked={props.showYearBoundary}
            icon={CalendarX}
            label="Show Year Boundary"
            onChange={props.setShowYearBoundary} />
          <Switch
            checked={props.showSeasonBoundary}
            icon={CalendarX}
            label="Show Season Boundary"
            onChange={props.setShowSeasonBoundary} />
          <Switch
            checked={props.showMonthBoundary}
            icon={CalendarX}
            label="Show Month Boundary"
            onChange={props.setShowMonthBoundary} />
        </div>
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7 p-0">
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
          <Button size="icon" variant="ghost" className="h-7 w-7 p-0">
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
