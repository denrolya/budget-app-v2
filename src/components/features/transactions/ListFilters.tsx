import React, { useState } from 'react';
import moment from 'moment';
import { CalendarIcon } from 'lucide-react';

import { TransactionFilters } from '@/models/TransactionFilters';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

interface ListFiltersProps {
  data: TransactionFilters;
  onChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => void;
}

const categories = ['Food & Drinks', 'Transportation', 'Entertainment', 'Bills', 'Shopping'];
const accounts = ['Checking', 'Savings', 'Credit Card', 'Cash'];
const datePresets = [
  { label: 'This Month', range: { from: moment().startOf('month'), to: moment().endOf('month') } },
  { label: 'Last 30 Days', range: { from: moment().subtract(30, 'days'), to: moment() } },
  { label: 'This Year', range: { from: moment().startOf('year'), to: moment().endOf('year') } },
  { label: 'Last Year', range: { from: moment().subtract(1, 'year').startOf('year'), to: moment().subtract(1, 'year').endOf('year') } },
];

export const ListFilters = ({ data, onChange }: ListFiltersProps) => {
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isAccountPopoverOpen, setIsAccountPopoverOpen] = useState(false);
  const [isAmountPopoverOpen, setIsAmountPopoverOpen] = useState(false);

  // Handling the date range change using the onChange prop
  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    onChange('after', range.from ? moment(range.from) : undefined);
    onChange('before', range.to ? moment(range.to) : undefined);
  };

  // Handling the amount range change using the onChange prop
  const handleAmountChange = (value: number[]) => {
    onChange('amountRange', value);
  };

  return (
    <>
      {/* Date Range Filter */}
      <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {data.after && data.before
              ? `${data.after.format('MMM D, YYYY')} - ${data.before.format('MMM D, YYYY')}`
              : data.after
                ? `After ${data.after.format('MMM D, YYYY')}`
                : data.before
                  ? `Before ${data.before.format('MMM D, YYYY')}`
                  : 'Select date range'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
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
            />
            <div className="border-l p-3 space-y-3">
              <h4 className="font-medium text-sm">Presets</h4>
              {datePresets.map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant="outline"
                  className="w-full justify-start text-left"
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
        </PopoverContent>
      </Popover>

      {/* Categories Filter */}
      <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
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
                <label htmlFor={`category-${category}`}>{category}</label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Accounts Filter */}
      <Popover open={isAccountPopoverOpen} onOpenChange={setIsAccountPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
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
                <label htmlFor={`account-${account}`}>{account}</label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Amount Range Filter */}
      <Popover open={isAmountPopoverOpen} onOpenChange={setIsAmountPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Amount: ${data.amountRange[0]} - ${data.amountRange[1]}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Amount Range</h4>
            <Slider
              min={0}
              max={10000}
              step={100}
              value={data.amountRange}
              onValueChange={handleAmountChange}
            />
            <div className="flex justify-between">
              <Input
                type="number"
                value={data.amountRange[0]}
                onChange={(e) => onChange('amountRange', [parseInt(e.target.value), data.amountRange[1]])}
                className="w-20"
              />
              <Input
                type="number"
                value={data.amountRange[1]}
                onChange={(e) => onChange('amountRange', [data.amountRange[0], parseInt(e.target.value)])}
                className="w-20"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Include Nested Categories Switch */}
      <div className="flex items-center space-x-2">
        <Switch
          id="nested-categories"
          checked={data.withNestedCategories}
          onCheckedChange={(checked) => onChange('withNestedCategories', checked)}
        />
        <Label htmlFor="nested-categories">Include nested categories</Label>
      </div>

      {/* Show Draft Transactions Switch */}
      <div className="flex items-center space-x-2">
        <Switch
          id="draft-transactions"
          checked={data.showDraftTransactions}
          onCheckedChange={(checked) => onChange('showDraftTransactions', checked)}
        />
        <Label htmlFor="draft-transactions">Show draft transactions</Label>
      </div>
    </>
  );
};
