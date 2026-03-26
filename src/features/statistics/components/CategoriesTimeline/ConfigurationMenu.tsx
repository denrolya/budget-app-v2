import { Move3D, Percent, SettingsIcon, Tags, TrendingDown, TrendingUp } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  showExpenseReference: boolean;
  setShowExpenseReference: (value: boolean) => void;
  showIncomeReference: boolean;
  setShowIncomeReference: (value: boolean) => void;
  showComparisonInTooltip: boolean;
  setShowComparisonInTooltip: (value: boolean) => void;
  fetchTransactionsFromSubcategories: boolean;
  setFetchTransactionsFromSubcategories: (value: boolean) => void;
  useSeparateAxisForTotals: boolean;
  setUseSeparateAxisForTotals: (value: boolean) => void;
}

const SwitchRow: React.FC<{
  id: string;
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}> = ({ id, icon: Icon, label, checked, onCheckedChange }) => (
  <div className="flex items-center justify-between">
    <Label htmlFor={id} className="flex items-center gap-2 text-xs cursor-pointer">
      <Icon className="h-3 w-3 text-muted-foreground" />
      {label}
    </Label>
    <Switch checked={checked} id={id} className="scale-75" onCheckedChange={onCheckedChange} />
  </div>
);

const MenuContent: React.FC<Props> = (props) => (
  <div className="space-y-3">
    <div>
      <Label className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">References</Label>
      <div className="mt-1.5 space-y-2">
        <SwitchRow
          checked={props.showExpenseReference}
          icon={TrendingDown}
          id="expense-ref"
          label="Total Expense Line"
          onCheckedChange={() => props.setShowExpenseReference(!props.showExpenseReference)}
        />
        <SwitchRow
          checked={props.showIncomeReference}
          icon={TrendingUp}
          id="income-ref"
          label="Total Income Line"
          onCheckedChange={() => props.setShowIncomeReference(!props.showIncomeReference)}
        />
      </div>
    </div>
    <div>
      <Label className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Display</Label>
      <div className="mt-1.5 space-y-2">
        <SwitchRow
          checked={props.showComparisonInTooltip}
          icon={Percent}
          id="comparison-tooltip"
          label="Comparison in Tooltip"
          onCheckedChange={() => props.setShowComparisonInTooltip(!props.showComparisonInTooltip)}
        />
        <SwitchRow
          checked={props.useSeparateAxisForTotals}
          icon={Move3D}
          id="separate-axis"
          label="Separate Y Axis for Totals"
          onCheckedChange={() => props.setUseSeparateAxisForTotals(!props.useSeparateAxisForTotals)}
        />
        <SwitchRow
          checked={props.fetchTransactionsFromSubcategories}
          icon={Tags}
          id="subcategories"
          label="Include Subcategories"
          onCheckedChange={() => props.setFetchTransactionsFromSubcategories(!props.fetchTransactionsFromSubcategories)}
        />
      </div>
    </div>
  </div>
);

const ConfigurationMenu: React.FC<Props> = (props) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7 p-0">
            <SettingsIcon className="h-3.5 w-3.5" />
            <span className="sr-only">Chart display options</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3">
          <MenuContent {...props} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 p-0">
          <SettingsIcon className="h-3.5 w-3.5" />
          <span className="sr-only">Chart display options</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-6">
        <DrawerHeader>
          <DrawerTitle>Chart Options</DrawerTitle>
          <DrawerDescription className="sr-only">Categories Timeline display settings</DrawerDescription>
        </DrawerHeader>
        <MenuContent {...props} />
      </DrawerContent>
    </Drawer>
  );
};

export default ConfigurationMenu;
