import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { cn } from '@/lib/utils';

export const Filters = () => {
  const [date, setDate] = useState<Date>();
  const [amountRange, setAmountRange] = useState([0, 1000]);
  const [minAmount, setMinAmount] = useState('0');
  const [maxAmount, setMaxAmount] = useState('1000');

  const handleAmountChange = (value: number[]) => {
    setAmountRange(value);
    setMinAmount(value[0].toString());
    setMaxAmount(value[1].toString());
  };

  const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= amountRange[1]) {
      setMinAmount(e.target.value);
      setAmountRange([value, amountRange[1]]);
    }
  };

  const handleMaxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= amountRange[0]) {
      setMaxAmount(e.target.value);
      setAmountRange([amountRange[0], value]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="date-picker">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant={'outline'}
              className={cn(
                'w-full justify-start text-left font-normal',
                !date && 'text-muted-foreground',
              )}
              aria-label="Select date"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">Income</Button>
          <Button variant="outline" size="sm">Expense</Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-search">Categories</Label>
        <Input id="category-search" type="text" placeholder="Search categories..." />
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">Food</Badge>
          <Badge variant="secondary">Transport</Badge>
          <Badge variant="secondary">Entertainment</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-search">Accounts</Label>
        <Input id="account-search" type="text" placeholder="Search accounts..." />
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">Checking</Badge>
          <Badge variant="secondary">Savings</Badge>
          <Badge variant="secondary">Credit Card</Badge>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="nested-categories" />
        <Label htmlFor="nested-categories">Include nested categories</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="draft-transactions" />
        <Label htmlFor="draft-transactions">Show only draft transactions</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount-slider">Amount Range</Label>
        <Slider
          id="amount-slider"
          value={amountRange}
          max={10000}
          step={10}
          onValueChange={handleAmountChange}
          aria-label="Amount range"
        />
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="min-amount">Min</Label>
            <Input
              id="min-amount"
              type="number"
              value={minAmount}
              onChange={handleMinAmountChange}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="max-amount">Max</Label>
            <Input
              id="max-amount"
              type="number"
              value={maxAmount}
              onChange={handleMaxAmountChange}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tag-search">Tags</Label>
        <Input id="tag-search" type="text" placeholder="Search tags..." />
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline">Work</Badge>
          <Badge variant="outline">Personal</Badge>
          <Badge variant="outline">Family</Badge>
        </div>
      </div>
    </div>
  );
};
