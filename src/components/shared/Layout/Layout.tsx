import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import AccountBalances from '@/components/AccountBalances/AccountBalances';
import Navbar from '@/components/shared/Navbar/Navbar';
import Sidebar from '@/components/shared/Sidebar/Sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
            <Outlet />
  );
};

export default Layout;
