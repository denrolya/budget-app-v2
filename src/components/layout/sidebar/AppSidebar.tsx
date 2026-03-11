import React from 'react';

import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';

import NavAccounts from './NavAccounts';
import NavMain from './NavMain';

const AppSidebar: React.FC<React.ComponentProps<typeof Sidebar>> = (props) => (
  <Sidebar collapsible="icon" {...props}>
    <SidebarContent className="overflow-hidden">
      <NavMain />
      <NavAccounts />
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
);

export default AppSidebar;
