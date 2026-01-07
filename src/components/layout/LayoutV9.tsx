import React from 'react';
import { Outlet } from 'react-router-dom';

import { FormRenderer } from '@/components/common/FormRenderer';
import Header from '@/components/layout/header/Header';
import MobileNavigation from '@/components/layout/MobileNavigation';
import Sidebar from '@/components/layout/sidebar/Sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

export const LayoutV9: React.FC = () => (
  <>
    <Sidebar />
    <SidebarInset>
      <div className="flex flex-col h-screen">
        <Header className="hidden md:flex" />

        <main className="flex flex-col h-full md:overflow-hidden bg-background">
          <Outlet />
        </main>

        <MobileNavigation />
        <FormRenderer />
      </div>
    </SidebarInset>
  </>
);

export default LayoutV9;
