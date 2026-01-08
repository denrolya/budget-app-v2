import React from 'react';

import { FormRenderer } from '@/components/common/FormRenderer';
import { SidebarInset } from '@/components/ui/sidebar';

import Header from './header/Header';
import MobileNavigation from './MobileNavigation';
import AppSidebar from './sidebar/AppSidebar';

const LayoutV9: React.FC = ({ children }) => (
  <>
    <AppSidebar />

    <SidebarInset>
      <div className="flex flex-col h-screen">
        <Header className="hidden md:flex" />

        <main className="flex flex-col h-full md:overflow-hidden bg-background">
          {children}
        </main>

        <MobileNavigation />
        <FormRenderer />
      </div>
    </SidebarInset>
  </>
);

export default LayoutV9;
