import cn from 'classnames';
import { ArrowDownCircle, ArrowUpCircle, Sigma, SettingsIcon } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Type as TransactionType } from '@/types/transaction';

interface UnifiedChartMenuProps {
  type: TransactionType;
  setType: (type: TransactionType) => void;
  showMonthlyAverage: boolean;
  setShowMonthlyAverage: (show: boolean) => void;
}

export const UnifiedChartMenu: React.FC<UnifiedChartMenuProps> = ({
  type,
  setType,
  showMonthlyAverage,
  setShowMonthlyAverage,
}) => {
  const isDesktop = useScreenSize();

  const MenuContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Transaction Type</Label>
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
        <div className="flex items-center justify-between">
          <Label htmlFor="show-monlty-average" className="flex items-center space-x-2 text-xs cursor-pointer">
            <Sigma className="h-3 w-3" />
            <span>Show Monthly Average Values</span>
          </Label>
          <Switch
            id="show-monlty-average"
            className="scale-75"
            checked={showMonthlyAverage}
            onCheckedChange={() => setShowMonthlyAverage(!showMonthlyAverage)}
          />
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
