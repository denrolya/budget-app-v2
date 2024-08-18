import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import AccountBalances from 'src/components/AccountBalances/AccountBalances';
import Navbar from 'src/components/shared/Navbar/Navbar';
import Sidebar from 'src/components/shared/Sidebar/Sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="h-screen flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
          <AccountBalances />
          <div className="bg-white dark:bg-gray-800 shadow">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
