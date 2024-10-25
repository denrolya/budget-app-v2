import { FinanceDataProvider } from '@/contexts/FinanceData/context';
import {
  useFinanceData,
  useAccounts,
  useActiveAccounts,
  useArchivedAccounts,
  useActiveAccountsWithDefaultOrder,
  useAccountsWithDefaultOrder,
  useDebts,
  useCategories,
  useExpenseCategories,
  useIncomeCategories,
  useIncomeCategoriesTree,
  useExpenseCategoriesTree,
  useExchangeRates,
  useFixerExchangeRates,
  useMonobankExchangeRates,
  useWiseExchangeRates,
} from '@/contexts/FinanceData/hooks';

export type {
  FinanceData,
  FinanceDataContextType,
} from '@/contexts/FinanceData/context';

export {
  FinanceDataProvider,
  useFinanceData,
  useAccounts,
  useActiveAccounts,
  useArchivedAccounts,
  useActiveAccountsWithDefaultOrder,
  useAccountsWithDefaultOrder,
  useDebts,
  useCategories,
  useExpenseCategories,
  useIncomeCategories,
  useIncomeCategoriesTree,
  useExpenseCategoriesTree,
  useExchangeRates,
  useFixerExchangeRates,
  useMonobankExchangeRates,
  useWiseExchangeRates,
};

export default FinanceDataProvider;
