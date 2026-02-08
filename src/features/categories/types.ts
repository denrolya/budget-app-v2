export type CategoryType = 'income' | 'expense';

export interface CategoryTagDTO {
  name: string;
}

export interface CategoryDTO {
  id: number;
  name: string;
  parent: { id: number } | null;
  root: { id: number } | null;
  type: CategoryType;
  color: string;
  createdAt: string;
  icon: string;
  isAffectingProfit: boolean;
  isTechnical: boolean;
  isFixed: boolean;
  tags: CategoryTagDTO[];
}

export interface CategoryApiResponseDTO {
  '@context': string;
  '@id': string;
  '@type': string;
  isFixed: boolean;
  name: string;
  isTechnical: boolean;
  parent: CategoryApiResponseDTO | null;
  isAffectingProfit: boolean;
  icon: string;
  color: string | null;
  tags: string[];
}

export interface CreateCategoryDTO {
  name: string;
  type: CategoryType;
  parentId?: number | null;
  isAffectingProfit?: boolean;
  isTechnical?: boolean;
  isFixed?: boolean;
}

export interface UpdateCategoryDTO {
  name?: string;
  parentId?: number | null;
  isAffectingProfit?: boolean;
  isTechnical?: boolean;
  isFixed?: boolean;
  type: CategoryType;
}

export interface MoveCategoryDTO {
  id: number;
  newParentId: number | null;
  type: CategoryType;
}
