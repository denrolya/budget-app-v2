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
  useTotalBalance,
  useTotalDebt,
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
  useTotalBalance,
  useTotalDebt,
};

export default FinanceDataProvider;
