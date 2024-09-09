import cn from 'classnames';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Calendar,
  CheckIcon,
  DollarSign,
  MoreHorizontalIcon,
  Percent,
  Tags,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import MultiSelect from '@/components/ui/multiselect.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

const categories = [
  'Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare',
];

const periods = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const comparisons = [
  { value: 'previous', label: 'Previous period' },
  { value: 'same-last-year', label: 'Same period last year' },
];

type CardProps = {
  initialType: 'income' | 'expense'
  initialCategory: string | null
  initialPeriod: 'week' | 'month' | 'year'
  initialComparison: 'previous' | 'same-last-year'
  amount: number
  previousAmount: number
}

export const FinancialCard = ({
                                initialType = 'expense',
                                initialCategory = null,
                                initialPeriod = 'month',
                                initialComparison = 'previous',
                                amount = 1200,
                                previousAmount = 1000,
                              }: CardProps) =>  {
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [period, setPeriod] = useState(initialPeriod);
  const [comparison, setComparison] = useState(initialComparison);
  const [comparisonDisplay, setComparisonDisplay] = useState<'percentage' | 'amount'>('percentage');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const percentageChange = ((amount - previousAmount) / previousAmount) * 100;
  const absoluteChange = amount - previousAmount;
  const isIncrease = amount > previousAmount;
  const isPositive = (type === 'income' && isIncrease) || (type === 'expense' && !isIncrease);

  const getTitle = () => {
    if (category) {
      return category;
    }
    return `Total ${type === 'income' ? 'Income' : 'Expenses'}`;
  };

  const getPeriodText = () => {
    switch (period) {
      case 'week':
        return 'Last 7 days';
      case 'month':
        return 'Last 30 days';
      case 'year':
        return 'This year';
      default:
        return '';
    }
  };

  const getComparisonText = () => {
    if (comparisonDisplay === 'percentage') {
      return `${Math.abs(percentageChange).toFixed(1)}%`;
    } else {
      return `$${Math.abs(absoluteChange).toLocaleString()}`;
    }
  };

  const MenuContent = React.forwardRef<
    React.ElementRef<typeof SheetContent>,
    React.ComponentPropsWithoutRef<typeof SheetContent>
  >(({ className, ...props }, ref) => (
    <div className={cn('px-4 py-3', className)} {...props} ref={ref}>
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">Type</h4>
          <Button
            variant={type === 'income' ? 'default' : 'outline'}
            size="sm"
            className="mr-2"
            onClick={() => setType('income')}
          >
            Income
          </Button>
          <Button
            variant={type === 'expense' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setType('expense')}
          >
            Expense
          </Button>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">Category</h4>
          <Command className="rounded-md border shadow-md">
            <CommandInput placeholder="Filter categories..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => setCategory(null)}
                >
                  All Categories
                  <CheckIcon
                    className={cn(
                      'ml-auto h-4 w-4',
                      category === null ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
                {categories.map((cat) => (
                  <CommandItem
                    key={cat}
                    value={cat}
                    onSelect={() => setCategory(cat)}
                  >
                    {cat}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        category === cat ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">Period</h4>
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              className="mr-2 mb-2"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">Comparison</h4>
          {comparisons.map((c) => (
            <Button
              key={c.value}
              variant={comparison === c.value ? 'default' : 'outline'}
              size="sm"
              className="mr-2 mb-2"
              onClick={() => setComparison(c.value)}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">Comparison Display</h4>
          <Button
            variant={comparisonDisplay === 'percentage' ? 'default' : 'outline'}
            size="sm"
            className="mr-2"
            onClick={() => setComparisonDisplay('percentage')}
          >
            <Percent className="mr-2 h-4 w-4" />
            Percentage
          </Button>
          <Button
            variant={comparisonDisplay === 'amount' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setComparisonDisplay('amount')}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Amount
          </Button>
        </div>
      </div>
    </div>
  ));
  MenuContent.displayName = 'MenuContent';

  if (loading) {
    return (
      <Card className="w-full h-[120px] overflow-hidden">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full sm:min-w-[240px] h-[120px] overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-sm">
              <span className="mr-2 rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground">
                {getTitle()}
              </span>
              <span className="text-muted-foreground">{getPeriodText()}</span>
            </h3>
          </div>
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Card Options</SheetTitle>
                </SheetHeader>
                <MenuContent />
              </SheetContent>
            </Sheet>
          ) : (
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setType(type === 'income' ? 'expense' : 'income')}>
                    <User className="mr-2 h-4 w-4" />
                    Switch to {type === 'income' ? 'Expense' : 'Income'}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Tags className="mr-2 h-4 w-4" />
                      Select category
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-0">
                      <Command>
                        <CommandInput
                          placeholder="Filter categories..."
                          autoFocus={true}
                        />
                        <CommandList>
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setCategory(null);
                                setOpen(false);
                              }}
                            >
                              All Categories
                              <CheckIcon
                                className={cn(
                                  'ml-auto h-4 w-4', {
                                    'opacity-100': category === null,
                                    'opacity-0': category !== null,
                                  }
                                )}
                              />
                            </CommandItem>
                            {categories.map((cat) => (
                              <CommandItem
                                key={cat}
                                value={cat}
                                onSelect={() => {
                                  setCategory(cat);
                                  setOpen(false);
                                }}
                              >
                                {cat}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4', {
                                      'opacity-100': category === cat,
                                      'opacity-0': category !== cat,
                                    }
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Calendar className="mr-2 h-4 w-4" />
                      Set period
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={period} onValueChange={setPeriod}>
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
                      <DropdownMenuRadioGroup value={comparison} onValueChange={setComparison}>
                        {comparisons.map((c) => (
                          <DropdownMenuRadioItem key={c.value} value={c.value}>
                            {c.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {comparisonDisplay === 'percentage' ? (
                        <Percent className="mr-2 h-4 w-4" />
                      ) : (
                        <DollarSign className="mr-2 h-4 w-4" />
                      )}
                      Comparison Display
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={comparisonDisplay}
                                              onValueChange={(value) => setComparisonDisplay(value as 'percentage' | 'amount')}>
                        <DropdownMenuRadioItem value="percentage">
                          <Percent className="mr-2 h-4 w-4" />
                          Percentage
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="amount">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Amount
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">${amount.toLocaleString()}</span>
          <div className={cn(
            'flex items-center', {
              'text-success': isPositive,
              'text-destructive': !isPositive,
            }
          )}>
            {isIncrease ? (
              <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="text-sm font-medium">
              {getComparisonText()}
              <span className="sr-only">
                {isPositive ? 'increase' : 'decrease'}
              </span>
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          vs {comparison === 'previous' ? 'previous' : 'last year'}
        </p>
      </CardContent>
    </Card>
  );
}
