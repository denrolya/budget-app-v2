import cn from 'classnames';
import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface HeaderLinkProps extends LinkProps {
  className?: string;
}

const HeaderLink: React.FC<HeaderLinkProps> = ({ to, children, className, ...rest }) => (
  <Link
    to={to}
    className={cn(
      'text-sm transition-colors hover:text-foreground/80 text-foreground focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-primary',
      className,
    )}
    {...rest}
  >
    {children}
  </Link>
);

HeaderLink.displayName = 'HeaderLink';

export default HeaderLink;
