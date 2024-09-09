import cn from 'classnames';
import {
  ArrowLeftRight,
  ArrowRightLeft,
  BarChart2,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Home,
  LogOut,
  Moon,
  PiggyBank,
  Plus,
  Settings,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import { Button } from '@/components/ui/button';
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

export const LayoutV6 = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isConverterVisible, setIsConverterVisible] = useState(false);
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(false);
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [baseCurrency, setBaseCurrency] = useState('USD');

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

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-accent/10 backdrop-blur-xl border-b border-accent h-10 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-4">
          <Link to="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Dashboard
          </Link>
          <div className="h-4 w-px bg-accent" />
          <Link to="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Transactions
          </Link>
          <div className="h-4 w-px bg-accent" />
          <Link to="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Reports
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
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
            <div className="text-xs text-accent-foreground/80 space-x-2">
              <span>{baseCurrency}/EUR: {getExchangeRate('Central Bank', baseCurrency, 'EUR').toFixed(2)}</span>
              <span>{baseCurrency}/GBP: {getExchangeRate('Central Bank', baseCurrency, 'GBP').toFixed(2)}</span>
              <span>{baseCurrency}/JPY: {getExchangeRate('Central Bank', baseCurrency, 'JPY').toFixed(2)}</span>
            </div>
          </div>
          <div className="h-4 w-px bg-accent" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsRightSidebarVisible(!isRightSidebarVisible)}
          >
            {isRightSidebarVisible ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <div className="h-4 w-px bg-accent" />
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
        <aside
          className={cn(
            'bg-accent/5 border-r border-accent flex flex-col transition-all duration-300 ease-in-out',
            isSidebarExpanded ? 'w-64' : 'w-16',
          )}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
        >
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <Button variant="ghost"
                        className={cn('w-full', isSidebarExpanded ? 'justify-start' : 'justify-center')}>
                  <Home className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Overview</span>}
                </Button>
                <Button variant="ghost"
                        className={cn('w-full', isSidebarExpanded ? 'justify-start' : 'justify-center')}>
                  <CreditCard className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Accounts</span>}
                </Button>
                <Button variant="ghost"
                        className={cn('w-full', isSidebarExpanded ? 'justify-start' : 'justify-center')}>
                  <BarChart2 className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Investments</span>}
                </Button>
              </div>

              <div className="h-px bg-accent" />

              <div className="space-y-1">
                {isSidebarExpanded && (
                  <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Tools</div>
                )}
                <Button variant="ghost"
                        className={cn('w-full', isSidebarExpanded ? 'justify-start' : 'justify-center')}>
                  <PiggyBank className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Budgets</span>}
                </Button>
                <Button variant="ghost"
                        className={cn('w-full', isSidebarExpanded ? 'justify-start' : 'justify-center')}>
                  <ArrowRightLeft className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Transfers</span>}
                </Button>
                <Button variant="ghost"
                        className={cn('w-full', isSidebarExpanded ? 'justify-start' : 'justify-center')}>
                  <Briefcase className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Financial Planning</span>}
                </Button>
              </div>

              <div className="h-px bg-accent" />

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
            <Button variant="ghost" className={cn('w-full', isSidebarExpanded ? 'justify-start' : 'justify-center')}>
              <Plus className="h-4 w-4" />
              {isSidebarExpanded && <span className="ml-2">Add Account</span>}
            </Button>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-background p-8">
          <Outlet />
        </main>

        {/* Right Sidebar */}
        <aside
          className={cn(
            'bg-accent/5 border-l border-accent flex flex-col transition-all duration-300 ease-in-out',
            isRightSidebarVisible ? 'w-80' : 'w-0',
          )}
        >
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <h3 className="font-semibold">Exchange Rates</h3>
              {Object.keys(exchangeRateSources).map((source) => (
                <div key={source} className="space-y-2">
                  <h4 className="text-sm font-medium">{source}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>{baseCurrency}/EUR: {getExchangeRate(source, baseCurrency, 'EUR').toFixed(4)}</div>
                    <div>{baseCurrency}/GBP: {getExchangeRate(source, baseCurrency, 'GBP').toFixed(4)}</div>
                    <div>{baseCurrency}/JPY: {getExchangeRate(source, baseCurrency, 'JPY').toFixed(2)}</div>
                    <div>{baseCurrency}/HUF: {getExchangeRate(source, baseCurrency, 'HUF').toFixed(2)}</div>
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Statistics ({baseCurrency}/EUR)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(calculateStatistics(baseCurrency, 'EUR')).map(([key, value]) => (
                    <div key={key}>{key}: {value.toFixed(4)}</div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* Retractable Currency Converter */}
      <div className="bg-accent/5 border-t border-accent">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-center py-2"
          onClick={() => setIsConverterVisible(!isConverterVisible)}
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Currency Converter
          {isConverterVisible ? (
            <ChevronDown className="h-4 w-4 ml-2" />
          ) : (
            <ChevronUp className="h-4 w-4 ml-2" />
          )}
        </Button>
        {isConverterVisible && (
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full"
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
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                >
                  {preset}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              1 {fromCurrency} = {getExchangeRate('Central Bank', fromCurrency, toCurrency).toFixed(4)} {toCurrency}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
