export { default as CategoriesManagementPage } from './routes/ManagementPage';
export { default as CategoriesTreePage } from './routes/TreePage';
export { useList, queryKeys } from './api';
export { default as Category } from './models/Category';
export * from './types';

// Public components (ONLY if reused outside transactions feature)
// If only used inside transactions pages/components — don't export.
