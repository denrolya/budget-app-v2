import { format } from 'date-fns';
import { CalendarIcon, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Drawer for filters on mobile */}
        <Drawer open={showFilters} onOpenChange={setShowFilters}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="lg:hidden mb-4">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh] flex flex-col">
            <DrawerHeader className="flex-shrink-0">
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>Refine your transaction list</DrawerDescription>
            </DrawerHeader>
            <div className="flex-grow overflow-y-auto px-4">
              <Filters />
            </div>
            <div className="p-4 border-t">
              <DrawerClose asChild>
                <Button className="w-full">Apply Filters</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Sidebar for filters on desktop */}
        <aside className="hidden lg:block w-64 space-y-6">
          <Filters />
        </aside>

        {/* Main content area */}
        <main className="flex-1 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Your Transactions</h2>
            <Select>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Render children components */}
          {children}
        </main>
      </div>
    </div>
  );
}

function Filters() {
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
}
