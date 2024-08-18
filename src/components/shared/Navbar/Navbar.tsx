import { Menu } from 'lucide-react';

interface Account {
  id: number;
  name: string;
  balance: number;
}

interface NavbarProps {
  toggleSidebar: () => void;
}

const accounts: Account[] = [
  { id: 1, name: 'Main', balance: 5000 },
  { id: 2, name: 'Savings', balance: 10000 },
  { id: 3, name: 'Investment', balance: 15000 },
];

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                {accounts.map((account) => (
                  <div key={account.id} className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{account.name}:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-white">
                      ${account.balance.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
