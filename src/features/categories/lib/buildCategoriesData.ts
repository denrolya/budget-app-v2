import type { CategoryDTO } from '../types';

import { buildCategoriesData as buildTree, CategoriesData } from './buildTree';

export type { CategoriesData };

export const buildCategoriesData = (rawCategories: unknown): CategoriesData =>
  buildTree(rawCategories as CategoryDTO[]);
