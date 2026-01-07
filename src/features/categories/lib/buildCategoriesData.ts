import Category, { CategoryTreeBuilder } from '../models/Category';

export type CategoriesData = {
  tree: Category[];
  list: Category[];
};

export const buildCategoriesData = (rawCategories: unknown): CategoriesData => {
  const treeBuilder = new CategoryTreeBuilder();
  const tree = treeBuilder.normalizeData(rawCategories);
  const list = treeBuilder.getPlainList();

  return { tree, list };
};
