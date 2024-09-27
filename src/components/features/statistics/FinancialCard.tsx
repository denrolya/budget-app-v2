import cn from 'classnames';
import { ArrowDownIcon, ArrowUpIcon, BarChartIcon, CalendarIcon, DollarSignIcon, TrendingUpIcon } from 'lucide-react';
import React, { useMemo } from 'react';

import MenuButton from '@/components/features/statistics/FinancialCardMenuButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCategories } from '@/contexts/FinanceData';

interface CardConfig {
  id: string;
  type: 'income' | 'expense';
  category: string | null;
  period: 'week' | 'month' | 'year';
  comparison: 'previous' | 'same-last-year';
  amount: number;
  previousAmount: number;
  statType: 'sum' | 'daily' | 'avg' | 'min-max';
  minAmount?: number;
  maxAmount?: number;
}

interface Props extends CardConfig {
  onConfigChange: (id: string, newConfig: Partial<CardConfig>) => void;
}

export const Component: React.FC<Props> = ({
                                             id,
                                             type,
                                             category,
                                             period,
                                             comparison,
                                             amount,
                                             previousAmount,
                                             statType,
                                             minAmount,
                                             maxAmount,
                                             onConfigChange,
                                           }) => {
  const { list: categories } = useCategories();
  const selectedCategory = useMemo(() => categories.find(c => c.name === category), [categories, category]);
  const percentageChange = ((amount - previousAmount) / previousAmount) * 100;
  const absoluteChange = amount - previousAmount;
  const isIncrease = amount > previousAmount;
  const isPositive = (type === 'income' && isIncrease) || (type === 'expense' && !isIncrease);

  const getTitle = () => category || (type === 'income' ? 'Income' : 'Expenses');

  const getPeriodText = () => {
    switch (period) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      default:
        return '';
    }
  };

  const getStatTypeInfo = () => {
    switch (statType) {
      case 'sum':
        return { icon: DollarSignIcon, label: 'Total', color: 'bg-blue-100 text-blue-800' };
      case 'daily':
        return { icon: CalendarIcon, label: 'Daily', color: 'bg-green-100 text-green-800' };
      case 'avg':
        return { icon: TrendingUpIcon, label: 'Average', color: 'bg-purple-100 text-purple-800' };
      case 'min-max':
        return { icon: BarChartIcon, label: 'Range', color: 'bg-orange-100 text-orange-800' };
    }
  };

  const getAmountDisplay = () => {
    if (statType === 'min-max' && minAmount !== undefined && maxAmount !== undefined) {
      return `$${minAmount.toLocaleString()} - $${maxAmount.toLocaleString()}`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const statTypeInfo = getStatTypeInfo();

  return (
    <Card
      className="w-full sm:min-w-[240px] h-[140px] overflow-hidden transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-primary/25 relative"
      id={id}
    >
      <div
        className={cn('absolute bottom-0 left-0 h-1', {
          'bg-success': isPositive,
          'bg-destructive': !isPositive,
        })}
        style={{ width: `${Math.min(Math.abs(percentageChange), 100)}%` }}
      />
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-primary truncate">{getTitle()}</h3>
            <p className="text-xs text-muted-foreground">{getPeriodText()}</p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <Badge variant="secondary" className={cn('flex items-center space-x-1', statTypeInfo.color)}>
              <statTypeInfo.icon className="h-3 w-3" />
              <span>{statTypeInfo.label}</span>
            </Badge>
            <MenuButton
              config={{
                id,
                type,
                category: selectedCategory?.id,
                period,
                comparison,
                amount,
                previousAmount,
                statType,
                minAmount,
                maxAmount,
              }}
              onConfigChange={onConfigChange}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold tracking-tight">{getAmountDisplay()}</span>
            <div
              className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center', {
                'bg-success/20 text-success': isPositive,
                'bg-destructive/20 text-destructive': !isPositive,
              })}
            >
              {isIncrease && <ArrowUpIcon className="h-3 w-3 mr-1" />}
              {!isIncrease && <ArrowDownIcon className="h-3 w-3 mr-1" />}
              {Math.abs(percentageChange).toFixed(0)}%
            </div>
          </div>
          {statType !== 'min-max' && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                vs {comparison === 'previous' ? 'previous' : 'last year'}
              </span>
              <span
                className={cn('font-medium', {
                  'text-success': isPositive,
                  'text-destructive': !isPositive,
                })}
              >
                {isIncrease ? '+' : '-'}${Math.abs(absoluteChange).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Component;
