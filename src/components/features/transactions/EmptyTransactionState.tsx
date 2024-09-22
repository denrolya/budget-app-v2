import { PlusCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface EmptyTransactionStateProps {
  onRefresh: () => void
  onAddTransaction: () => void
}

const EmptyTransactionState = ({ onRefresh, onAddTransaction }: EmptyTransactionStateProps) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <svg
          className="mx-auto h-24 w-24 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-primary">No transactions found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          It looks like you haven't added any transactions yet or your filters didn't match any results.
        </p>
        <div className="mt-6 flex justify-center space-x-4">
          <Button onClick={onRefresh} variant="outline" className="inline-flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={onAddTransaction} className="inline-flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>
    </div>
  );

export default EmptyTransactionState;
