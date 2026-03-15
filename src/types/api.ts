export interface HydraCollection<T> {
  'hydra:member': T[];
  'hydra:totalItems'?: number;
  'hydra:view'?: unknown;
  'hydra:search'?: unknown;
}
