export type TabKey = 'accounts' | 'currencies' | 'categories';

export type Datum = { id: string | number; label: string; value: number };

export type Item = {
  id: string;
  name: string;
  value: number;
  amount?: number;
  currency?: string | null;
  color?: string | null; // accounts only
  hasChildren?: boolean; // categories: has drillable subcategories
};

export type ProcessedCategory = {
  id: number;
  name: string;
  value: number;
  children?: ProcessedCategory[];
};
