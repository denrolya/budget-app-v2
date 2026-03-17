import { type Bucket } from './models/types';

export const PRESET_BUCKETS: Bucket[] = [
  { id: 'reserve', name: 'Emergency Reserve', emoji: '🛡️', color: '#22c55e', isPreset: true, targetAmount: 21000 },
  { id: 'investments', name: 'Investments', emoji: '📈', color: '#6b47c9', isPreset: true },
  { id: 'operational', name: 'Operational Cash', emoji: '💵', color: '#f59e0b', isPreset: true },
  {
    id: 're_protection',
    name: 'Real Estate Protection',
    emoji: '🏠',
    color: '#3b82f6',
    isPreset: true,
    targetAmount: 6080,
  },
  { id: 'p2p_surplus', name: 'P2P → Investments', emoji: '🔄', color: '#6b7280', isPreset: true },
];

export const STORAGE_KEY = 'buckets-config';
export const UNASSIGNED_ID = '__unassigned__';

export const STRONG_CURRENCIES = new Set(['EUR', 'USD', 'GBP', 'CHF']);
