import { useState } from 'react';
import { CalendarIcon, ChevronRightIcon, TrendingUpIcon, TrendingDownIcon, BarChartIcon, PieChartIcon, RadarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

const expenseData = {
  name: 'Root',
  children: [
    {
      name: 'Housing',
      currentPeriod: 1200,
      previousPeriod: 1100,
      children: [
        { name: 'Rent', currentPeriod: 1000, previousPeriod: 950 },
        { name: 'Utilities', currentPeriod: 200, previousPeriod: 150 },
      ]
    },
    {
      name: 'Food',
      currentPeriod: 500,
      previousPeriod: 450,
      children: [
        { name: 'Groceries', currentPeriod: 300, previousPeriod: 280 },
        { name: 'Dining Out', currentPeriod: 200, previousPeriod: 170 },
      ]
    },
    {
      name: 'Transportation',
      currentPeriod: 300,
      previousPeriod: 320,
      children: [
        { name: 'Public Transit', currentPeriod: 100, previousPeriod: 120 },
        { name: 'Car Expenses', currentPeriod: 200, previousPeriod: 200 },
      ]
    },
    {
      name: 'Entertainment',
      currentPeriod: 200,
      previousPeriod: 180,
      children: [
        { name: 'Movies', currentPeriod: 50, previousPeriod: 40 },
        { name: 'Hobbies', currentPeriod: 150, previousPeriod: 140 },
      ]
    },
    {
      name: 'Healthcare',
      currentPeriod: 250,
      previousPeriod: 220,
      children: [
        { name: 'Insurance', currentPeriod: 150, previousPeriod: 140 },
        { name: 'Medical Expenses', currentPeriod: 100, previousPeriod: 80 },
      ]
    },
  ]
};

type Category = {
  name: string
  currentPeriod: number
  previousPeriod: number
  children?: Category[]
}

type ChartType = 'radar' | 'bar' | 'doughnut'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const CategoryTreeCardSkeleton = () => (
  <Card className="w-full max-w-4xl mx-auto h-[800px] flex flex-col animate-pulse">
    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
      <CardTitle className="text-2xl font-bold">
        <div className="h-8 w-48 bg-muted rounded"></div>
      </CardTitle>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal" disabled>
          <CalendarIcon className="mr-2 h-4 w-4" />
          <div className="h-4 w-32 bg-muted rounded"></div>
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" disabled>
            <RadarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled>
            <BarChartIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled>
            <PieChartIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex-grow overflow-hidden flex flex-col">
      <div className="mb-4">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center space-x-2">
            {[1, 2].map((_, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <div className="h-4 w-4 mx-2 bg-muted rounded"></div>}
                <div className="h-4 w-20 bg-muted rounded"></div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <div className="flex flex-col gap-6 flex-grow overflow-hidden">
        <div className="w-full h-[300px] bg-muted rounded"></div>
        <div className="w-full flex-grow overflow-hidden">
          <h4 className="text-lg font-semibold mb-2">
            <div className="h-6 w-40 bg-muted rounded"></div>
          </h4>
          <div className="h-[calc(100%-2rem)] pr-4 overflow-hidden">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                  <div className="flex items-center space-x-3 flex-grow">
                    <div className="w-4 h-4 rounded-full bg-muted/70"></div>
                    <div className="flex-grow min-w-0">
                      <div className="h-4 w-24 bg-muted/70 rounded mb-1"></div>
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-16 bg-muted/70 rounded"></div>
                        <div className="h-3 w-12 bg-muted/70 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <div className="h-6 w-14 bg-muted/70 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const CategoryTreeCard = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(2023, 0, 1),
    to: new Date(2023, 11, 31)
  });
  const [currentCategory, setCurrentCategory] = useState<Category>(expenseData);
  const [categoryPath, setCategoryPath] = useState<Category[]>([expenseData]);
  const [chartType, setChartType] = useState<ChartType>('radar');

  const handleDateRangeChange = (range: { from: Date; to: Date | undefined }) => {
    if (range.from && range.to) {
      setDateRange(range as { from: Date; to: Date });
      // In a real application, you would fetch new data based on the date range here
    }
  };

  const handleCategoryClick = (category: Category) => {
    if (category.children) {
      setCurrentCategory(category);
      setCategoryPath(prev => [...prev, category]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = categoryPath.slice(0, index + 1);
    setCurrentCategory(newPath[newPath.length - 1]);
    setCategoryPath(newPath);
  };

  const chartData = currentCategory.children?.map(cat => ({
    name: cat.name,
    currentPeriod: cat.currentPeriod,
    previousPeriod: cat.previousPeriod,
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-4 rounded shadow-md border border-border">
          <p className="font-bold">{data.name}</p>
          <p>Current Period: ${data.currentPeriod}</p>
          <p>Previous Period: ${data.previousPeriod}</p>
          <p>Difference: ${(data.currentPeriod - data.previousPeriod).toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar name="Current Period" dataKey="currentPeriod" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="Previous Period" dataKey="previousPeriod" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="currentPeriod" name="Current Period" fill="#8884d8" />
              <Bar dataKey="previousPeriod" name="Previous Period" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="currentPeriod"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={55}
                fill="#82ca9d"
                paddingAngle={5}
                dataKey="previousPeriod"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[800px] flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Expense Analysis</CardTitle>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} -{' '}
                      {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="flex space-x-2">
            <Button
              variant={chartType === 'radar' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setChartType('radar')}
              aria-label="Radar Chart"
            >
              <RadarIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setChartType('bar')}
              aria-label="Bar Chart"
            >
              <BarChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'doughnut' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setChartType('doughnut')}
              aria-label="Doughnut Chart"
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden flex flex-col">
        <div className="mb-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center space-x-2">
              {categoryPath.map((category, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <ChevronRightIcon className="h-4 w-4 mx-2 text-muted-foreground" />}
                  <Button
                    variant="link"
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`p-0 h-auto ${index === categoryPath.length - 1 ? 'font-semibold' : ''}`}
                  >
                    {category.name}
                  </Button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        <div className="flex flex-col gap-6 flex-grow overflow-hidden">
          <div className="w-full h-[300px]">
            {renderChart()}
          </div>
          <div className="w-full flex-grow overflow-hidden">
            <ScrollArea className="h-[calc(100%-2rem)] pr-4">
              <div className="space-y-2">
                {chartData.map((category, index) => {
                  const diff = category.currentPeriod - category.previousPeriod;
                  const percentChange = ((diff / category.previousPeriod) * 100).toFixed(1);
                  return (
                    <div key={category.name}
                         className="flex items-center justify-between py-2 px-3 bg-muted rounded-md hover:bg-muted/80 transition-colors">
                      <div className="flex items-center space-x-3 flex-grow">
                        <div className="w-4 h-4 rounded-full flex-shrink-0"
                             style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <div className="flex-grow min-w-0">
                          <h5 className="font-medium text-sm truncate">{category.name}</h5>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>${category.currentPeriod.toLocaleString()}</span>
                            <span className={`flex items-center ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {diff >= 0 ? (
                              <TrendingUpIcon className="inline mr-1 h-3 w-3" />
                            ) : (
                              <TrendingDownIcon className="inline mr-1 h-3 w-3" />
                            )}
                              {percentChange}%
                          </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const fullCategory = currentCategory.children?.find(cat => cat.name === category.name);
                          if (fullCategory) {
                            handleCategoryClick(fullCategory);
                          }
                        }}
                        className="ml-2 text-xs"
                      >
                        Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryTreeCard;
