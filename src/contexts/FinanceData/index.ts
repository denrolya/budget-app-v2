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
  useExchangeRates,
  useFixerExchangeRates,
  useMonobankExchangeRates,
} from '@/contexts/FinanceData/hooks';

export type {
  Debt,
  ExchangeRates,
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
  useExchangeRates,
  useFixerExchangeRates,
  useMonobankExchangeRates,
};

export default FinanceDataProvider;
