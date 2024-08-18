import { X } from 'lucide-react';
import cn from 'classnames';

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, toggleSidebar }) => (
    <aside className={cn('bg-gray-100 dark:bg-gray-900 w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 lg:block', {
      'hidden': !sidebarOpen,
      'block': sidebarOpen,
    })}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg font-medium text-gray-900 dark:text-white">Menu</span>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="p-4 space-y-2">
            <li>
              <a href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md">Dashboard</a>
            </li>
            <li>
              <a href="/transactions" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md">Transactions</a>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );

export default Sidebar;
