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
  tags: CategoryTagDTO[];
}
