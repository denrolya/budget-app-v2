import { Button } from '@/components/ui/button.tsx';

interface Account {
  id: number;
  name: string;
  balance: number;
  convertedValues?: Record<string, number>;
}

const accounts: Account[] = [
  { id: 1, name: 'Mono EUR', balance: 5000, convertedValues: { EUR: 5000, USD: 6500, UAH: 293993, BTC: 0.00431234 } },
  { id: 2, name: 'Wise EUR', balance: 10000, convertedValues: { EUR: 10000, USD: 13000, UAH: 587986, BTC: 0.00862468 } },
  { id: 3, name: 'InteractiveBrokers USD', balance: 30000, convertedValues: { EUR: 30000, USD: 39000, UAH: 1763958, BTC: 0.02587404 } },
  { id: 4, name: 'Kraken USD', balance: 2000, convertedValues: { EUR: 2000, USD: 2600, UAH: 117595, BTC: 0.00172493 } },
];

const AccountBalances: React.FC = () => (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{account.name}</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  ${account.balance.toLocaleString()} <Button>Button</Button>
                </dd>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

export default AccountBalances;
