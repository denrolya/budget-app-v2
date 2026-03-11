import { Bucket } from './models/types';

export const PRESET_BUCKETS: Bucket[] = [
  { id: 'emergency', name: 'Emergency Fund', emoji: '💰', color: '#22c55e', isPreset: true },
  { id: 'investments', name: 'Investments', emoji: '📈', color: '#3b82f6', isPreset: true },
  { id: 'expenses', name: 'Current Expenses', emoji: '💳', color: '#f59e0b', isPreset: true },
  { id: 'goals', name: 'Goals', emoji: '🎯', color: '#a855f7', isPreset: true },
  { id: 'buffer', name: 'Buffer', emoji: '🔄', color: '#6b7280', isPreset: true },
];

export const STORAGE_KEY = 'buckets-config';
export const UNASSIGNED_ID = '__unassigned__';

export const STRONG_CURRENCIES = new Set(['EUR', 'USD', 'GBP', 'CHF']);
