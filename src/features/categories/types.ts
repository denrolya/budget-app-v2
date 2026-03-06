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
  isFixed: boolean;
  tags: CategoryTagDTO[];
}

export interface CategoryApiResponseDTO {
  '@context': string;
  '@id': string;
  '@type': string;
  isFixed: boolean;
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

/** Hydra wrapper (API Platform often returns this) */
export type HydraCollection<T> = {
  'hydra:member': T[];
  'hydra:totalItems'?: number;
  'hydra:view'?: unknown;
  'hydra:search'?: unknown;
};

/** ===== UI DTOs (used by components/hooks) ===== */
export type CreateCategoryDTO = {
  type: CategoryType;
  name: string;
  parent?: CategoryId | null;
  isAffectingProfit?: boolean;
  isFixed?: boolean;
};

export type UpdateCategoryDTO = {
  type: CategoryType;
  name?: string;
  parent?: CategoryId | null;
  isAffectingProfit?: boolean;
  isFixed?: boolean;
};

/** ===== API DTOs (actual request payloads) ===== */
export type ApiCreateCategoryPayload = {
  name: string;
  isAffectingProfit?: boolean;
  isFixed?: boolean;
  parent?: Iri | null;
  icon?: string | null;
  color?: string | null;
  tags?: Array<{ name: string }> | [];
};

export type ApiUpdateCategoryPayload = {
  name?: string;
  isAffectingProfit?: boolean;
  isFixed?: boolean;
  parent?: Iri | null;
  icon?: string | null;
  color?: string | null;
  tags?: Array<{ name: string }> | [];
};

export type CategoryApiDTO = {
  id: CategoryId;
  name: string;
  type?: string; // API отдаёт type readOnly string
  isAffectingProfit?: boolean;
  isFixed?: boolean;

  parent?: { id: CategoryId } | Iri | null;
  root?: { id: CategoryId } | Iri | null;

  color?: string | null;
  icon?: string | null;
  tags?: Array<{ name: string }> | [];

  children?: Array<Iri> | CategoryApiDTO[]; // зависит от endpoint-а
};

export type CategoriesApiResponse =
  | HydraCollection<CategoryApiDTO>
  | CategoryApiDTO[];
