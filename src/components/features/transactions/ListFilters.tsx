import cn from 'classnames';
import { CalendarIcon, FilterIcon } from 'lucide-react';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { useCategories } from '@/contexts/FinanceData';
import { TransactionFilters } from '@/models/TransactionFilters';

interface ListFiltersProps {
  data: TransactionFilters;
  className?: string;
  onChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => void;
}

const accounts = ['Checking', 'Savings', 'Credit Card', 'Cash'];
const datePresets = [
  { label: 'This Month', range: { from: moment().startOf('month'), to: moment().endOf('month') } },
  { label: 'Last 30 Days', range: { from: moment().subtract(30, 'days'), to: moment() } },
  { label: 'This Year', range: { from: moment().startOf('year'), to: moment().endOf('year') } },
  {
    label: 'Last Year',
    range: { from: moment().subtract(1, 'year').startOf('year'), to: moment().subtract(1, 'year').endOf('year') },
  },
];

export const ListFilters: React.FC<ListFiltersProps> = ({ data, className, onChange }) => {
  const categories = useCategories();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState<boolean>(false);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState<boolean>(false);
  const [isAccountPopoverOpen, setIsAccountPopoverOpen] = useState<boolean>(false);
  const [isAmountPopoverOpen, setIsAmountPopoverOpen] = useState<boolean>(false);

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    onChange('after', range.from ? moment(range.from) : undefined);
    onChange('before', range.to ? moment(range.to) : undefined);
  };

  const handleAmountChange = (value: number[]) => {
    onChange('amountRange', value);
  };

  useEffect(() => {
    console.log(selectedCategories);
  }, [selectedCategories.length]);

  return (
    <div className={cn('flex flex-wrap items-center gap-2 p-4 bg-background rounded-lg shadow-md', className)}>
      <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 text-sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">
              {data.after && data.before
                ? `${data.after.format('MMM D, YYYY')} - ${data.before.format('MMM D, YYYY')}`
                : data.after
                  ? `After ${data.after.format('MMM D, YYYY')}`
                  : data.before
                    ? `Before ${data.before.format('MMM D, YYYY')}`
                    : 'Date'}
            </span>
            <span className="sm:hidden">Date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={data.after?.toDate() || moment().toDate()}
              selected={{
                from: data.after?.toDate(),
                to: data.before?.toDate(),
              }}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
              className="border-b"
            />
            <div className="p-3 space-y-3">
              <h4 className="font-medium text-sm text-primary">Presets</h4>
              <div className="grid grid-cols-2 gap-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant="secondary"
                    className="w-full justify-start text-left text-xs"
                    onClick={() => {
                      handleDateRangeChange(preset.range);
                      setIsDatePopoverOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <CategoryTypeahead multiple value={selectedCategories} onChange={setSelectedCategories} className="h-9 text-sm" />

      <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 text-sm">
            <FilterIcon className="mr-2 h-4 w-4" />
            Categories ({data.categories.length})
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px]">
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={data.categories.includes(category)}
                  onCheckedChange={(checked) => {
                    onChange(
                      'categories',
                      checked
                        ? [...data.categories, category]
                        : data.categories.filter((c) => c !== category),
                    );
                  }}
                />
                <Label htmlFor={`category-${category}`} className="text-sm">{category}</Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={isAccountPopoverOpen} onOpenChange={setIsAccountPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 text-sm">
            <FilterIcon className="mr-2 h-4 w-4" />
            Accounts ({data.accounts.length})
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px]">
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account} className="flex items-center space-x-2">
                <Checkbox
                  id={`account-${account}`}
                  checked={data.accounts.includes(account)}
                  onCheckedChange={(checked) => {
                    onChange(
                      'accounts',
                      checked
                        ? [...data.accounts, account]
                        : data.accounts.filter((a) => a !== account),
                    );
                  }}
                />
                <Label htmlFor={`account-${account}`} className="text-sm">{account}</Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={isAmountPopoverOpen} onOpenChange={setIsAmountPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 text-sm">
            <FilterIcon className="mr-2 h-4 w-4" />
            ${data.amountRange[0]} - ${data.amountRange[1]}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium leading-none mb-2 text-primary">Amount Range</h4>
            <Slider
              min={0}
              max={10000}
              step={100}
              value={data.amountRange}
              onValueChange={handleAmountChange}
            />
            <div className="flex justify-between mt-2">
              <Input
                type="number"
                value={data.amountRange[0]}
                onChange={(e) => onChange('amountRange', [parseInt(e.target.value), data.amountRange[1]])}
                className="w-20 text-sm"
              />
              <Input
                type="number"
                value={data.amountRange[1]}
                onChange={(e) => onChange('amountRange', [data.amountRange[0], parseInt(e.target.value)])}
                className="w-20 text-sm"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant={data.withNestedCategories ? 'secondary' : 'outline'}
        size="sm"
        className="h-9 text-sm"
        onClick={() => onChange('withNestedCategories', !data.withNestedCategories)}
      >
        <span className="hidden sm:inline">Nested Categories</span>
        <span className="sm:hidden">Nested</span>
      </Button>

      <Button
        variant={data.isDraft ? 'secondary' : 'outline'}
        size="sm"
        className="h-9 text-sm"
        onClick={() => onChange('isDraft', !data.isDraft)}
      >
        <span className="hidden sm:inline">Draft Transactions</span>
        <span className="sm:hidden">Drafts</span>
      </Button>
    </div>
  );
};

export default ListFilters;
