import React from 'react';

import NavAccounts from '@/components/layout/sidebar/NavAccounts';
import NavMain from '@/components/layout/sidebar/NavMain';
import NavUser from '@/components/layout/sidebar/NavUser';
import CurrencySwitcher from '@/components/layout/sidebar/CurrencySwitcher';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';


const AppSidebar: React.FC<React.ComponentProps<typeof Sidebar>> = (props) => (
  <Sidebar collapsible="icon" {...props}>
    <SidebarHeader>
      <CurrencySwitcher />
    </SidebarHeader>
    <SidebarContent>
      <NavMain />
      <NavAccounts />
    </SidebarContent>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
);

export default AppSidebar;
