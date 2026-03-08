import { BarChart, LineChart, Move3D, Percent, SettingsIcon, Tags, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { CategoryTypeahead } from '@/features/categories';
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
import { ISO8601Period } from '@/types/global';

const periodOptions: { value: ISO8601Period; label: string }[] = [
  { value: 'P1D', label: 'Daily' },
  { value: 'P1W', label: 'Weekly' },
  { value: 'P1M', label: 'Monthly' },
  { value: 'P3M', label: 'Quarterly' },
  { value: 'P1Y', label: 'Yearly' },
];

interface UnifiedChartMenuProps {
  chartType: 'bar' | 'line';
  setChartType: (value: 'bar' | 'line') => void;
  selectedPeriod: ISO8601Period;
  setSelectedPeriod: (value: ISO8601Period) => void;
  selectedCategories: number[];
  setSelectedCategories: (categories: number[]) => void;
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

export const UnifiedChartMenu: React.FC<UnifiedChartMenuProps> = ({
  chartType,
  setChartType,
  selectedPeriod,
  setSelectedPeriod,
  selectedCategories,
  setSelectedCategories,
  showExpenseReference,
  setShowExpenseReference,
  showIncomeReference,
  setShowIncomeReference,
  showComparisonInTooltip,
  setShowComparisonInTooltip,
  fetchTransactionsFromSubcategories,
  setFetchTransactionsFromSubcategories,
  useSeparateAxisForTotals,
  setUseSeparateAxisForTotals,
}) => {
  const isMobile = useIsMobile();

  const MenuContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Period</Label>
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((option) => (
            <Button
              variant={selectedPeriod === option.value ? 'default' : 'outline'}
              key={option.value}
              onClick={() => setSelectedPeriod(option.value)}
            >
              {option.label[0]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="categories">Categories</Label>
        </div>

        <CategoryTypeahead
          multiple
          id="categories"
          value={selectedCategories.map(String)}
          className="h-9 w-full"
          onChange={(categories) => setSelectedCategories((categories as string[] | null)?.map(Number) ?? [])}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Chart Type</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            className="flex items-center px-2 py-1 space-x-1"
            onClick={() => setChartType('line')}
          >
            <LineChart className="h-4 w-4" />
            Line
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            className="flex items-center px-2 py-1 space-x-1"
            onClick={() => setChartType('bar')}
          >
            <BarChart className="h-4 w-4" />
            Bar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Display Options</Label>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-total-expense" className="flex items-center space-x-2 text-xs cursor-pointer">
            <TrendingDown className="h-3 w-3" />
            <span>Show Total Expense</span>
          </Label>
          <Switch
            checked={showExpenseReference}
            id="show-total-expense"
            className="scale-75"
            onCheckedChange={() => setShowExpenseReference(!showExpenseReference)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-total-income" className="flex items-center space-x-2 text-xs cursor-pointer">
            <TrendingUp className="h-3 w-3" />
            <span>Show Income Reference</span>
          </Label>
          <Switch
            checked={showIncomeReference}
            id="show-total-income"
            className="scale-75"
            onCheckedChange={() => setShowIncomeReference(!showIncomeReference)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-comparison-in-tooltip" className="flex items-center space-x-2 text-xs cursor-pointer">
            <Percent className="h-3 w-3" />
            <span>Show Comparison In Tooltip</span>
          </Label>
          <Switch
            checked={showComparisonInTooltip}
            id="show-comparison-in-tooltip"
            className="scale-75"
            onCheckedChange={() => setShowComparisonInTooltip(!showComparisonInTooltip)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor="fetch-transactions-from-subcategories"
            className="flex items-center space-x-2 text-xs cursor-pointer"
          >
            <Tags className="h-3 w-3" />
            <span>Fetch Transactions From Subcategories</span>
          </Label>
          <Switch
            checked={fetchTransactionsFromSubcategories}
            id="fetch-transactions-from-subcategories"
            className="scale-75"
            onCheckedChange={() => setFetchTransactionsFromSubcategories(!fetchTransactionsFromSubcategories)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="use-separate-axis-for-totals" className="flex items-center space-x-2 text-xs cursor-pointer">
            <Move3D className="h-3 w-3" />
            <span>Use separate Y Axis for Totals</span>
          </Label>
          <Switch
            checked={useSeparateAxisForTotals}
            id="use-separate-axis-for-totals"
            className="scale-75"
            onCheckedChange={() => setUseSeparateAxisForTotals(!useSeparateAxisForTotals)}
          />
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
        <PopoverContent className="p-3 w-100">
          <MenuContent />
        </PopoverContent>
      </Popover>
    );
  }

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
          <DrawerDescription className="sr-only">Categories Timeline configuration</DrawerDescription>
        </DrawerHeader>
        <MenuContent />
      </DrawerContent>
    </Drawer>
  );
};

export default UnifiedChartMenu;
