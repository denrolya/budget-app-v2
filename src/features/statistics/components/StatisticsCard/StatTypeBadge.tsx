import { BarChartIcon, CalendarIcon, DollarSignIcon, TrendingUpIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type StatType = 'sum' | 'daily' | 'avg' | 'min-max';

interface StatTypeInfo {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  color: string;
}

const getStatTypeInfo = (statType: StatType): StatTypeInfo => {
  switch (statType) {
    case 'sum':
      return { icon: DollarSignIcon, label: 'Total', color: 'bg-info/15 text-info' };
    case 'daily':
      return { icon: CalendarIcon, label: 'Daily', color: 'bg-success/15 text-success' };
    case 'avg':
      return { icon: TrendingUpIcon, label: 'Average', color: 'bg-primary/15 text-primary' };
    case 'min-max':
      return { icon: BarChartIcon, label: 'Range', color: 'bg-warning/15 text-warning' };
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
