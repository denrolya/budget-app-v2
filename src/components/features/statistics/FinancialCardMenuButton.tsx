import { Calendar, DollarSign, SettingsIcon, Tags, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CardConfig {
  id: string;
  type: 'income' | 'expense';
  category: string | number | null;
  period: 'week' | 'month' | 'year';
  comparison: 'previous' | 'same-last-year';
  amount: number;
  previousAmount: number;
  statType: 'sum' | 'daily' | 'avg' | 'min-max';
  minAmount?: number;
  maxAmount?: number;
}

interface Props {
  config: CardConfig;
  onConfigChange: (id: string, newConfig: Partial<CardConfig>) => void;
}

const comparisons = [
  { value: 'previous', label: 'Previous period' },
  { value: 'same-last-year', label: 'Same period last year' },
];

const periods = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const statTypes = [
  { value: 'sum', label: 'Sum' },
  { value: 'daily', label: 'Daily' },
  { value: 'avg', label: 'Average' },
  { value: 'min-max', label: 'Min-Max' },
];

const FinanceCardMenuButton: React.FC<Props> = ({ config, onConfigChange }) => {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleConfigChange = (key: keyof CardConfig, value: any) => {
    onConfigChange(config.id, { [key]: value });
  };

  const renderContent = () => (
    <div className="px-4 py-3 space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-medium">Type</h4>
        <div className="flex space-x-2">
          {['income', 'expense'].map((t) => (
            <Button
              key={t}
              variant={config.type === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleConfigChange('type', t as 'income' | 'expense')}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium">Category</h4>
        <CategoryTypeahead
          value={config.category}
          onChange={(c) => handleConfigChange('category', c)}
        />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium">Period</h4>
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={config.period === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleConfigChange('period', p.value as 'week' | 'month' | 'year')}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium">Comparison</h4>
        <div className="flex flex-wrap gap-2">
          {comparisons.map((c) => (
            <Button
              key={c.value}
              variant={config.comparison === c.value ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                handleConfigChange('comparison', c.value as 'previous' | 'same-last-year')
              }
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium">Stat Type</h4>
        <div className="flex flex-wrap gap-2">
          {statTypes.map((s) => (
            <Button
              key={s.value}
              variant={config.statType === s.value ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                handleConfigChange('statType', s.value as 'sum' | 'daily' | 'avg' | 'min-max')
              }
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return isMobile ? (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <SettingsIcon className="h-4 w-4" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Card Options</DrawerTitle>
        </DrawerHeader>
        {renderContent()}
      </DrawerContent>
    </Drawer>
  ) : (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <SettingsIcon className="h-4 w-4" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Card Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => handleConfigChange('type', config.type === 'income' ? 'expense' : 'income')}
          >
            <User className="mr-2 h-4 w-4" />
            Switch to {config.type === 'income' ? 'Expense' : 'Income'}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Tags className="mr-2 h-4 w-4" />
              Select category
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <CategoryTypeahead
                value={config.category}
                onChange={(c) => handleConfigChange('category', c)}
              />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Calendar className="mr-2 h-4 w-4" />
              Set period
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={config.period}
                onValueChange={(value) => handleConfigChange('period', value as 'week' | 'month' | 'year')}
              >
                {periods.map((p) => (
                  <DropdownMenuRadioItem key={p.value} value={p.value}>
                    {p.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Calendar className="mr-2 h-4 w-4" />
              Set comparison
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={config.comparison}
                onValueChange={(value) =>
                  handleConfigChange('comparison', value as 'previous' | 'same-last-year')
                }
              >
                {comparisons.map((c) => (
                  <DropdownMenuRadioItem key={c.value} value={c.value}>
                    {c.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <DollarSign className="mr-2 h-4 w-4" />
              Set stat type
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={config.statType}
                onValueChange={(value) =>
                  handleConfigChange('statType', value as 'sum' | 'daily' | 'avg' | 'min-max')
                }
              >
                {statTypes.map((s) => (
                  <DropdownMenuRadioItem key={s.value} value={s.value}>
                    {s.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FinanceCardMenuButton;
