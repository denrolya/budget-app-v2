import Category from '../models/Category';
import type { CategoryDTO } from '../types';

import sortCategoryTree from './sortCategoryTree';

export type CategoriesData = {
  tree: Category[];
  list: Category[];
  map: Map<number, Category>;
};

export const buildCategoriesData = (dtos: CategoryDTO[]): CategoriesData => {
  const map = new Map<number, Category>();

  // 1) instantiate
  for (const dto of dtos) {
    if (!map.has(dto.id)) map.set(dto.id, new Category(dto));
  }

  // 2) link parent/root + children
  for (const dto of dtos) {
    const category = map.get(dto.id);
    if (!category) continue;

    const parentId = dto.parent?.id;
    if (parentId) {
      const parent = map.get(parentId);
      if (parent) parent.addChild(category);
    }

    const rootId = dto.root?.id;
    if (rootId) {
      const root = map.get(rootId);
      if (root) category.root = root;
    }
  }

  const tree = sortCategoryTree(Array.from(map.values()).filter((c) => c.parent === null));
  const list = flattenTree(tree);

  return { tree, list, map };
};

/** Flatten a sorted tree into a list preserving tree order (pre-order traversal). */
const flattenTree = (categories: Category[]): Category[] => {
  const result: Category[] = [];
  const walk = (cats: Category[]) => {
    for (const cat of cats) {
      result.push(cat);
      walk(cat.children);
    }
  };
  walk(categories);
  return result;
};
