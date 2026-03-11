import Account from '@/features/accounts/models/Account';

export interface Bucket {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isPreset: boolean;
}

export interface BucketShare {
  bucketId: string;
  amount: number; // in account's native currency (must be > 0)
}

/** accountId → list of bucket shares (sum ≤ account.balance) */
export type AllocationMap = Record<number, BucketShare[]>;

export interface BucketsConfig {
  version: 2;
  buckets: Bucket[];
  allocationMap: AllocationMap;
  monthlyExpenses: number | null;
  visualization: 'treemap' | 'pie';
}

/** One account's allocated portion inside a specific bucket */
export interface BucketEntry {
  account: Account;
  amount: number;           // in account's native currency
  allocatedBalance: number; // in baseCurrency (derived)
  maxAmount: number;        // max allocatable to this bucket = amount + account's unallocated remainder
}

/** One account's unallocated remainder */
export interface UnassignedEntry {
  account: Account;
  unallocatedAmount: number;   // in account's native currency
  unallocatedBalance: number;  // in baseCurrency (derived)
  isPartial: boolean;          // true if some of this account is already allocated elsewhere
}

export type RuleStatus = 'pass' | 'warn' | 'fail' | 'na';

export interface HealthResult {
  status: RuleStatus;
  detail: string;
}

export interface HealthRule {
  id: string;
  title: string;
  evaluate: (ctx: HealthContext) => HealthResult;
}

export interface HealthContext {
  buckets: Bucket[];
  bucketBalances: Record<string, number>;
  entriesByBucket: Record<string, BucketEntry[]>;
  totalBalance: number;
  unassignedBalance: number;
  monthlyExpenses: number | null;
  monthlyIncome: number | null;
  baseCurrency: string;
  strongCurrencyBalance: number;
  maxSingleAccountBalance: number;
}
