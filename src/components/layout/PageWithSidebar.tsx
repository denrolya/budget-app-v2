import { ChevronLeft } from 'lucide-react';
import React, { ReactNode, useId } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type PageWithSidebarProps = React.ComponentPropsWithoutRef<'div'> & {
  sidebarWidth?: string; // Tailwind class, e.g. "w-80". Default is a reasonable desktop width.
  sidebarScrollable?: boolean; // If true, this component provides scrolling for sidebar region.
  contentScrollable?: boolean; // If true, this component provides scrolling for content region.
  children: ReactNode;
  ariaLabel?: string;
};

type PageWithSidebarComponent = React.FC<PageWithSidebarProps> & {
  Header: React.FC<
    React.ComponentPropsWithoutRef<'header'> & {
      title?: ReactNode;
      onBack?: () => void;
      overrideContent?: boolean;
      backAriaLabel?: string;
    }
  >;
  Sidebar: React.FC<React.ComponentPropsWithoutRef<'aside'> & { ariaLabel?: string }>;
  Content: React.FC<React.ComponentPropsWithoutRef<'main'> & { ariaLabel?: string }>;
};

const PageWithSidebar: PageWithSidebarComponent = ({
  children,
  className = '',
  sidebarWidth = 'w-80',
  sidebarScrollable = false,
  contentScrollable = true,
  ariaLabel = 'Page layout',
  ...props
}) => {
  const isMobile = useIsMobile();
  const childrenArray = React.Children.toArray(children);

  const header = childrenArray.find((child) => React.isValidElement(child) && child.type === PageWithSidebar.Header);
  const sidebar = childrenArray.find((child) => React.isValidElement(child) && child.type === PageWithSidebar.Sidebar);
  const content = childrenArray.find((child) => React.isValidElement(child) && child.type === PageWithSidebar.Content);

  // Mobile rule:
  // - header exists => details view => show content
  // - otherwise => list-first => show sidebar (fallback to content)
  const mobileBody = header ? content : (sidebar ?? content);

  const renderScrollable = (node: ReactNode) => (
    <ScrollArea className="h-full">
      {/* Critical: min-h-full + flex so children can truly center using flex-1/h-full */}
      <div className="min-h-full min-w-0 flex flex-col">{node}</div>
    </ScrollArea>
  );

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'flex h-full min-h-0 overflow-hidden',
        // Ensure flex children can shrink properly (prevents weird overflow issues in nested layouts)
        'min-w-0',
        className,
      )}
      {...props}
    >
      {/* Desktop sidebar */}
      {!isMobile && (
        <div
          aria-label="Sidebar container"
          className={cn('shrink-0 border-r bg-background', 'min-h-0 h-full overflow-x-hidden', sidebarWidth)}
        >
          {sidebarScrollable ? (
            renderScrollable(sidebar)
          ) : (
            <div className="h-full min-h-0 min-w-0 overflow-x-hidden">{sidebar}</div>
          )}
        </div>
      )}

      {/* Main column (desktop) / single column (mobile) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {isMobile && header}
        {!isMobile && header}

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {isMobile ? (
            contentScrollable ? (
              renderScrollable(mobileBody)
            ) : (
              <div className="h-full min-h-0 min-w-0 overflow-hidden">{mobileBody}</div>
            )
          ) : contentScrollable ? (
            renderScrollable(content)
          ) : (
            <div className="h-full min-h-0 min-w-0 overflow-hidden">{content}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<
  React.ComponentPropsWithoutRef<'header'> & {
    title?: ReactNode;
    onBack?: () => void;
    overrideContent?: boolean;
    backAriaLabel?: string;
  }
> = ({ children, className = '', title, onBack, overrideContent = false, backAriaLabel = 'Back', ...props }) => {
  const titleId = useId();

  return (
    <header
      aria-labelledby={typeof title === 'string' ? titleId : undefined}
      className={cn('bg-background border-b p-4', className)}
      {...props}
    >
      {overrideContent ? (
        children
      ) : (
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <Button aria-label={backAriaLabel} size="icon" type="button" variant="ghost" onClick={onBack}>
                <ChevronLeft aria-hidden="true" className="h-6 w-6" />
              </Button>
            )}

            {typeof title === 'string' ? (
              <h1 id={titleId} className="text-xl font-bold truncate">
                {title}
              </h1>
            ) : (
              <div className="min-w-0">{title}</div>
            )}
          </div>

          <div className="flex items-center gap-2">{children}</div>
        </div>
      )}
    </header>
  );
};

const Sidebar: React.FC<React.ComponentPropsWithoutRef<'aside'> & { ariaLabel?: string }> = ({
  children,
  className = '',
  ariaLabel = 'Sidebar',
  ...props
}) => (
  <aside
    aria-label={ariaLabel}
    className={cn('flex min-h-0 h-full min-w-0 flex-col overflow-x-hidden', className)}
    {...props}
  >
    {children}
  </aside>
);

const Content: React.FC<React.ComponentPropsWithoutRef<'main'> & { ariaLabel?: string }> = ({
  children,
  className = '',
  ariaLabel = 'Content',
  ...props
}) => (
  <main aria-label={ariaLabel} className={cn('min-h-0 h-full min-w-0 overflow-x-hidden', className)} {...props}>
    {children}
  </main>
);

PageWithSidebar.Header = Header;
PageWithSidebar.Sidebar = Sidebar;
PageWithSidebar.Content = Content;

export default PageWithSidebar;
