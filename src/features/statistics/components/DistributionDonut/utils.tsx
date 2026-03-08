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
