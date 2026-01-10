import { Badge } from '@/components/ui/badge';
import cn from 'classnames';
import { BarChartIcon, CalendarIcon, DollarSignIcon, TrendingUpIcon } from 'lucide-react';
import React from 'react';

export type StatType = 'sum' | 'daily' | 'avg' | 'min-max';

interface StatTypeInfo {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  color: string;
}

const getStatTypeInfo = (statType: StatType): StatTypeInfo => {
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

interface StatTypeBadgeProps {
  type: StatType;
}

export const StatTypeBadge: React.FC<StatTypeBadgeProps> = ({ type }) => {
  const typeInfo = getStatTypeInfo(type);

  return (
    <Badge variant="secondary" className={cn('flex items-center space-x-1', typeInfo.color)}>
      <typeInfo.icon className="h-3 w-3" />
      <span>{typeInfo.label}</span>
    </Badge>
  );
};

export default StatTypeBadge;
