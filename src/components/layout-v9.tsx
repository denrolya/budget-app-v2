import cn from 'classnames';
import {
  ArrowLeftRight,
  ArrowRightLeft,
  BarChart2,
  Briefcase,
  ChevronRight,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import { CurrencySelector } from '@/components/currency-selector.tsx';
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
import { Separator } from '@/components/ui/separator.tsx';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Mock data for different exchange rate sources
const exchangeRateSources = {
  'Central Bank': {
    USD: { EUR: 0.92, GBP: 0.79, JPY: 148.21, HUF: 354.50 },
    EUR: { USD: 1.09, GBP: 0.86, JPY: 161.10, HUF: 385.33 },
    HUF: { USD: 0.0028, EUR: 0.0026, GBP: 0.0022, JPY: 0.42 },
  },
  'Market Average': {
    USD: { EUR: 0.93, GBP: 0.80, JPY: 148.50, HUF: 355.00 },
    EUR: { USD: 1.08, GBP: 0.86, JPY: 160.80, HUF: 384.50 },
    HUF: { USD: 0.0028, EUR: 0.0026, GBP: 0.0022, JPY: 0.42 },
  },
  'Commercial Bank': {
    USD: { EUR: 0.91, GBP: 0.78, JPY: 147.90, HUF: 353.80 },
    EUR: { USD: 1.10, GBP: 0.85, JPY: 161.50, HUF: 386.00 },
    HUF: { USD: 0.0028, EUR: 0.0026, GBP: 0.0022, JPY: 0.41 },
  },
};

export function LayoutV9() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarMouseEnter = () => {
    if (!isMobile) {
      setIsSidebarExpanded(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!isMobile) {
      setIsSidebarExpanded(false);
    }
  };

  const getExchangeRate = (source: string, from: string, to: string) => {
    if (from === to) return 1;
    return exchangeRateSources[source as keyof typeof exchangeRateSources][from as keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources]][to as keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources][keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources]]] || 0;
  };

  const calculateStatistics = (from: string, to: string) => {
    const rates = Object.keys(exchangeRateSources).map(source => getExchangeRate(source, from, to));
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

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-accent/10 backdrop-blur-xl border-b border-accent h-10 md:h-8 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            {isSidebarExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <nav className="hidden md:flex space-x-4">
            <Link
              to="/dashboard"
              className="text-sm transition-colors hover:text-foreground/80 text-foreground focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/transactions"
              className="text-sm transition-colors hover:text-foreground/80 text-foreground/60 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-primary"
            >
              Transactions
            </Link>
            <Link
              to="/debts"
              className="text-sm transition-colors hover:text-foreground/80 text-foreground/60 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-primary"
            >
              Debts
            </Link>
            <Link
              to="#"
              className="text-sm transition-colors hover:text-foreground/80 text-foreground/60 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-primary"
            >
              Accounts
            </Link>
            <Link
              to="#"
              className="text-sm transition-colors hover:text-foreground/80 text-foreground/60 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-primary"
            >
              Reports
            </Link>
            <Link
              to="#"
              className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-primary"
            >
              Categories
            </Link>
          </nav>
        </div>
        <Separator orientation="vertical" className="hidden md:block" />
        <div className="flex items-center space-x-2 md:space-x-4">
          <Sheet>
            <SheetTrigger asChild>
              <div className="hidden md:flex items-center text-xs text-accent-foreground/80 space-x-2 cursor-pointer hover:text-accent-foreground transition-colors">
                <span className="font-mono">{baseCurrency}/EUR: {getExchangeRate('Central Bank', baseCurrency, 'EUR').toFixed(2)}</span>
                <span className="font-mono">{baseCurrency}/GBP: {getExchangeRate('Central Bank', baseCurrency, 'GBP').toFixed(2)}</span>
                <span className="font-mono">{baseCurrency}/JPY: {getExchangeRate('Central Bank', baseCurrency, 'JPY').toFixed(2)}</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Exchange Rates</SheetTitle>
                <SheetDescription>
                  Current exchange rates and statistics
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
                <div className="space-y-4">
                  {Object.keys(exchangeRateSources).map((source) => (
                    <div key={source} className="space-y-2">
                      <h4 className="text-sm font-medium">{source}</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>{baseCurrency}/EUR: {getExchangeRate(source, baseCurrency, 'EUR').toFixed(4)}</div>
                        <div>{baseCurrency}/GBP: {getExchangeRate(source, baseCurrency, 'GBP').toFixed(4)}</div>
                        <div>{baseCurrency}/JPY: {getExchangeRate(source, baseCurrency, 'JPY').toFixed(2)}</div>
                        <div>{baseCurrency}/HUF: {getExchangeRate(source, baseCurrency, 'HUF').toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Statistics ({baseCurrency}/EUR)</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {Object.entries(calculateStatistics(baseCurrency, 'EUR')).map(([key, value]) => (
                        <div key={key}>{key}: {value.toFixed(4)}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <CurrencySelector />
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
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Overlay for mobile when sidebar is open */}
        {isMobile && isSidebarExpanded && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Left Sidebar */}
        <aside
          className={cn(
            'bg-background border-r border-accent flex flex-col transition-all duration-300 ease-in-out z-40',
            isMobile
              ? isSidebarExpanded
                ? 'fixed inset-y-0 left-0 w-64'
                : 'fixed inset-y-0 -left-64 w-64'
              : isSidebarExpanded
                ? 'w-64'
                : 'w-16',
          )}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        >
          <ScrollArea className="flex-1 flex flex-col h-full">
            <div className="flex-grow overflow-hidden flex flex-col">
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
                <Separator />
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
              </div>
              <Separator />
              {isSidebarExpanded && (
                <div className="flex-grow flex flex-col min-h-0 p-4">
                  <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Recent Accounts</div>
                  <ScrollArea className="flex-grow">
                    <div className="pr-4 space-y-1">
                      {[...Array(20)].map((_, i) => (
                        <Button key={i} variant="ghost" className="w-full justify-start font-normal">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Account {i + 1}
                        </Button>
                      ))}
                    </div>
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
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>

      {/* Currency Converter Drawer */}
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full">
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
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full font-mono"
                />
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
                <div className="w-full text-2xl font-bold font-mono">
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
            <Button variant="outline" size="sm" onClick={swapCurrencies} className="w-full">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Swap Currencies
            </Button>
            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                  className="font-mono"
                >
                  {preset}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
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
}
