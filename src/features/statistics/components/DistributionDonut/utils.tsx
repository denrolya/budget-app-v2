import { CURRENCIES } from '@/constants/currency';

import type { ProcessedCategory } from './types';

type CategoryApiNode = {
  id: number;
  name: string;
  total: number;
  children?: CategoryApiNode[];
};

export const processCategoryTree = (data: CategoryApiNode[]): ProcessedCategory[] =>
  data?.map((category) => {
    const children = category.children ? processCategoryTree(category.children) : [];
    const totalChildrenValue = children.reduce((sum: number, child: ProcessedCategory) => sum + child.value, 0);
    const uncategorizedValue = category.total - totalChildrenValue;

    if (uncategorizedValue > 0) {
      children.push({
        id: category.id,
        name: `Uncategorized in ${category.name}`,
        value: uncategorizedValue,
      });
    }

    return {
      id: category.id,
      name: category.name,
      value: category.total,
      children,
    };
  }) || [];

export const renderNativeLine = (amount?: number, code?: string | null) => {
  if (typeof amount !== 'number' || !code) return null;
  const symbol = CURRENCIES[code as keyof typeof CURRENCIES]?.symbol;

  return (
    <span className="text-2xs leading-4 text-muted-foreground">
      {symbol ? `${symbol} ${amount.toLocaleString()}` : `${amount.toLocaleString()} ${code}`}
    </span>
  );
};
