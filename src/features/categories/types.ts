import type { HydraCollection } from '@/types/api';

export interface CategoryTagDTO {
  name: string;
}

export interface CategoryDTO {
  id: number;
  name: string;
  parent: { id: number } | null;
  root: { id: number } | null;
  type: CategoryType;
  createdAt: string;
  isAffectingProfit: boolean;
  tags: CategoryTagDTO[];
}

export interface CategoryApiResponseDTO {
  '@context': string;
  '@id': string;
  '@type': string;
  name: string;
  parent: CategoryApiResponseDTO | null;
  isAffectingProfit: boolean;
}

// features/categories/types.ts

export enum CategoryType {
  Expense = 'expense',
  Income = 'income',
}

/** Domain */
export type CategoryId = number;

/** API Platform relations are IRIs, not numeric IDs */
export type Iri = string;

/** ===== UI DTOs (used by components/hooks) ===== */
export type CreateCategoryDTO = {
  type: CategoryType;
  name: string;
  parent?: CategoryId | null;
  isAffectingProfit?: boolean;
};

export type UpdateCategoryDTO = {
  type: CategoryType;
  name?: string;
  parent?: CategoryId | null;
  isAffectingProfit?: boolean;
};

/** ===== API DTOs (actual request payloads) ===== */
export type ApiCreateCategoryPayload = {
  name: string;
  isAffectingProfit?: boolean;
  parent?: Iri | null;
  tags?: Array<{ name: string }> | [];
};

export type ApiUpdateCategoryPayload = {
  name?: string;
  isAffectingProfit?: boolean;
  parent?: Iri | null;
  tags?: Array<{ name: string }> | [];
};

export type CategoryApiDTO = {
  id: CategoryId;
  name: string;
  type?: string;
  isAffectingProfit?: boolean;

  parent?: { id: CategoryId } | Iri | null;
  root?: { id: CategoryId } | Iri | null;

  tags?: Array<{ name: string }> | [];

  children?: Array<Iri> | CategoryApiDTO[];
};

export type CategoriesApiResponse = HydraCollection<CategoryApiDTO> | CategoryApiDTO[];
