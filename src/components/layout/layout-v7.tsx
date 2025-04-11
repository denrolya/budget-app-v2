import cn from 'classnames';
import {
  ArrowLeftRight,
  ArrowRightLeft,
  BarChart2,
  Briefcase,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  Settings,
  User,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Mock data for different exchange rate sources
const exchangeRateSources = {
  'Central Bank': {
    USD: { EUR: 0.92, GBP: 0.79, JPY: 148.21, HUF: 354.5 },
    EUR: { USD: 1.09, GBP: 0.86, JPY: 161.1, HUF: 385.33 },
    HUF: { USD: 0.0028, EUR: 0.0026, GBP: 0.0022, JPY: 0.42 },
  },
  'Market Average': {
    USD: { EUR: 0.93, GBP: 0.8, JPY: 148.5, HUF: 355.0 },
    EUR: { USD: 1.08, GBP: 0.86, JPY: 160.8, HUF: 384.5 },
    HUF: { USD: 0.0028, EUR: 0.0026, GBP: 0.0022, JPY: 0.42 },
  },
  'Commercial Bank': {
    USD: { EUR: 0.91, GBP: 0.78, JPY: 147.9, HUF: 353.8 },
    EUR: { USD: 1.1, GBP: 0.85, JPY: 161.5, HUF: 386.0 },
    HUF: { USD: 0.0028, EUR: 0.0026, GBP: 0.0022, JPY: 0.41 },
  },
};

export const LayoutV7 = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [baseCurrency, setBaseCurrency] = useState('USD');

  const getExchangeRate = (source: string, from: string, to: string) => {
    if (from === to) return 1;
    return (
      exchangeRateSources[source as keyof typeof exchangeRateSources][
        from as keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources]
      ][
        to as keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources][keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources]]
      ] || 0
    );
  };

  const calculateStatistics = (from: string, to: string) => {
    const rates = Object.keys(exchangeRateSources).map((source) => getExchangeRate(source, from, to));
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const spread = max - min;
    return { avg, min, max, spread };
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const presetAmounts = [1, 5, 10, 50, 100, 500];

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-accent/10 backdrop-blur-xl border-b border-accent h-14 flex items-center px-4 justify-between">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarExpanded(true)}>
          <Menu className="h-6 w-6" />
        </Button>
        <div className="hidden md:flex space-x-2">
          <Button variant="ghost" size="sm" className="text-xs">
            Dashboard
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            Transactions
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            Reports
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer">
                <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                  <SelectTrigger className="w-[70px] h-7 text-xs">
                    <SelectValue placeholder="Base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="HUF">HUF</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-accent-foreground/80 space-x-2 hidden md:inline-block">
                  <span>
                    {baseCurrency}/EUR: {getExchangeRate('Central Bank', baseCurrency, 'EUR').toFixed(2)}
                  </span>
                  <span>
                    {baseCurrency}/GBP: {getExchangeRate('Central Bank', baseCurrency, 'GBP').toFixed(2)}
                  </span>
                  <span>
                    {baseCurrency}/JPY: {getExchangeRate('Central Bank', baseCurrency, 'JPY').toFixed(2)}
                  </span>
                </div>
              </div>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Exchange Rates</SheetTitle>
                <SheetDescription>Current exchange rates and statistics for {baseCurrency}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {Object.keys(exchangeRateSources).map((source) => (
                  <div key={source} className="space-y-2">
                    <h4 className="text-sm font-medium">{source}</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        {baseCurrency}/EUR: {getExchangeRate(source, baseCurrency, 'EUR').toFixed(4)}
                      </div>
                      <div>
                        {baseCurrency}/GBP: {getExchangeRate(source, baseCurrency, 'GBP').toFixed(4)}
                      </div>
                      <div>
                        {baseCurrency}/JPY: {getExchangeRate(source, baseCurrency, 'JPY').toFixed(2)}
                      </div>
                      <div>
                        {baseCurrency}/HUF: {getExchangeRate(source, baseCurrency, 'HUF').toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Statistics ({baseCurrency}/EUR)</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(calculateStatistics(baseCurrency, 'EUR')).map(([key, value]) => (
                      <div key={key}>
                        {key}: {value.toFixed(4)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={cn(
            'bg-accent/5 border-r border-accent flex flex-col transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-50 md:relative',
            isSidebarExpanded ? 'w-64' : 'w-0 md:w-16',
          )}
        >
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Overview</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <CreditCard className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Accounts</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <BarChart2 className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Investments</span>}
                </Button>
              </div>

              <div className="space-y-1">
                {isSidebarExpanded && (
                  <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Tools</div>
                )}
                <Button variant="ghost" className="w-full justify-start">
                  <PiggyBank className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Budgets</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <ArrowRightLeft className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Transfers</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Briefcase className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Financial Planning</span>}
                </Button>
              </div>

              {isSidebarExpanded && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Recent Accounts</div>
                  <ScrollArea className="h-[200px] w-full pr-4">
                    {[...Array(20)].map((_, i) => (
                      <Button key={i} variant="ghost" className="w-full justify-start font-normal mb-1">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Account {i + 1}
                      </Button>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-accent">
            <Button variant="ghost" className="w-full justify-start">
              <Plus className="h-4 w-4" />
              {isSidebarExpanded && <span className="ml-2">Add Account</span>}
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-auto bg-background p-4">
          {/* Content removed as requested */}
          <p className="text-center text-muted-foreground">Main content area</p>
        </div>
      </div>

      {/* Currency Converter Drawer */}
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="fixed bottom-4 right-4 rounded-full">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Currency Converter
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Currency Converter</DrawerTitle>
            <DrawerDescription>Convert between different currencies</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full" />
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="HUF">HUF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-full text-2xl font-bold">
                    {(parseFloat(amount) * getExchangeRate('Central Bank', fromCurrency, toCurrency)).toFixed(2)}
                  </div>
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="HUF">HUF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={swapCurrencies}>
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <Button key={preset} variant="outline" size="sm" onClick={() => setAmount(preset.toString())}>
                  {preset}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              1 {fromCurrency} = {getExchangeRate('Central Bank', fromCurrency, toCurrency).toFixed(4)} {toCurrency}
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
