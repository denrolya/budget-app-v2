import { buildCategoriesData as buildTree, CategoriesData } from './buildTree';
import type { CategoryDTO } from '../types';

export type { CategoriesData };

export const buildCategoriesData = (rawCategories: unknown): CategoriesData =>
  buildTree(rawCategories as CategoryDTO[]);
