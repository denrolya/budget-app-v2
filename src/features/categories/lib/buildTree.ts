import Category from '../models/Category';
import type { CategoryDTO } from '../types';

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

  const tree = sortTree(Array.from(map.values()).filter((c) => c.parent === null));
  const list = flattenTree(tree);

  return { tree, list, map };
};

/** Sort categories: those with isAffectingProfit children first, then alphabetical. Recurses into children. */
const sortTree = (categories: Category[]): Category[] =>
  [...categories]
    .sort((a, b) => {
      const aHas = a.children.some((c) => c.isAffectingProfit);
      const bHas = b.children.some((c) => c.isAffectingProfit);
      if (aHas !== bHas) return aHas ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((cat) => {
      if (cat.children.length > 0) {
        cat.children = sortTree(cat.children);
      }
      return cat;
    });

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
