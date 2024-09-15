import cn from 'classnames';
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isSidebarExpanded: boolean;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ isSidebarExpanded, to, icon: Icon, children }) => {
  const { pathname } = useLocation();
  const isActive = useMemo(() => pathname === to, [pathname, to]);
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
        {
          'bg-primary text-primary-foreground': isActive,
          'text-foreground': !isActive,
        },
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {isSidebarExpanded && <span className="ml-2">{children}</span>}
    </Link>
  );
};

SidebarLink.displayName = 'SidebarLink';

export default SidebarLink;
