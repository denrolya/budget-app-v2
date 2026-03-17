import { ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import React, { type ReactNode, useCallback, useContext, useId, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// ─── Collapsible context ──────────────────────────────────────────────────────

interface CollapsibleContextValue {
  collapsible: boolean;
  collapsed: boolean;
  toggle: () => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue>({
  collapsible: false,
  collapsed: false,
  toggle: () => {},
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseTailwindWidth = (cls: string): number => {
  const num = cls.match(/^w-(\d+)$/)?.[1];
  return num ? parseInt(num) * 4 : 288;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type PageWithSidebarProps = React.ComponentPropsWithoutRef<'div'> & {
  sidebarWidth?: string;
  sidebarScrollable?: boolean;
  contentScrollable?: boolean;
  collapsible?: boolean;
  resizable?: boolean;
  children: ReactNode;
  ariaLabel?: string;
};

type PageWithSidebarComponent = React.FC<PageWithSidebarProps> & {
  Header: React.FC<
    Omit<React.ComponentPropsWithoutRef<'header'>, 'title'> & {
      title?: ReactNode;
      onBack?: () => void;
      overrideContent?: boolean;
      backAriaLabel?: string;
      subContent?: ReactNode;
    }
  >;
  Sidebar: React.FC<React.ComponentPropsWithoutRef<'aside'> & { ariaLabel?: string }>;
  Content: React.FC<React.ComponentPropsWithoutRef<'main'> & { ariaLabel?: string }>;
};

// ─── PageWithSidebar ──────────────────────────────────────────────────────────

const PageWithSidebar: PageWithSidebarComponent = ({
  children,
  className = '',
  sidebarWidth = 'w-80',
  sidebarScrollable = false,
  contentScrollable = true,
  collapsible = false,
  resizable = false,
  ariaLabel = 'Page layout',
  ...props
}) => {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((v) => !v), []);

  // Resizable sidebar state
  const defaultPx = useMemo(() => parseTailwindWidth(sidebarWidth), [sidebarWidth]);
  const [sidebarPx, setSidebarPx] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const currentPx = sidebarPx ?? defaultPx;

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = currentPx;
      setIsResizing(true);
      const onMove = (ev: MouseEvent) => {
        const newW = Math.max(160, Math.min(560, startW + ev.clientX - startX));
        setSidebarPx(newW);
      };
      const onUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [currentPx],
  );

  const childrenArray = React.Children.toArray(children);
  const header = childrenArray.find((child) => React.isValidElement(child) && child.type === PageWithSidebar.Header);
  const sidebar = childrenArray.find((child) => React.isValidElement(child) && child.type === PageWithSidebar.Sidebar);
  const content = childrenArray.find((child) => React.isValidElement(child) && child.type === PageWithSidebar.Content);

  const mobileBody = header ? content : (sidebar ?? content);

  const renderScrollable = (node: ReactNode) => (
    <ScrollArea className="h-full">
      <div className="min-h-full min-w-0 flex flex-col">{node}</div>
    </ScrollArea>
  );

  const showCollapsible = collapsible && !isMobile;
  const isCollapsed = showCollapsible && collapsed;
  const showResizable = resizable && !isMobile && !isCollapsed;

  const ctxValue = useMemo<CollapsibleContextValue>(
    () => ({ collapsible: showCollapsible, collapsed: isCollapsed, toggle }),
    [showCollapsible, isCollapsed, toggle],
  );

  // Sidebar width: use pixel value when resizable (dynamic), Tailwind class otherwise
  const sidebarStyle = showResizable ? { width: currentPx } : undefined;
  const sidebarWidthClass = showResizable ? '' : isCollapsed ? 'w-0 border-r-0' : sidebarWidth;

  return (
    <CollapsibleContext.Provider value={ctxValue}>
      <div
        aria-label={ariaLabel}
        className={cn('flex h-full min-h-0 overflow-hidden min-w-0', className)}
        {...props}
      >
        {/* Desktop sidebar */}
        {!isMobile && (
          <div
            aria-label="Sidebar container"
            style={sidebarStyle}
            className={cn(
              'shrink-0 border-r bg-background min-h-0 h-full overflow-hidden relative',
              !isResizing && 'transition-[width] duration-200 ease-in-out',
              sidebarWidthClass,
            )}
          >
            {sidebarScrollable ? renderScrollable(sidebar) : (
              <div className="h-full min-h-0 min-w-0 overflow-x-hidden">{sidebar}</div>
            )}
            {/* Resize handle — invisible, widens the grab area to cover the border */}
            {showResizable && (
              <div
                aria-hidden
                className="absolute right-0 top-0 h-full w-2 cursor-col-resize z-20 hover:bg-primary/20 transition-colors"
                onMouseDown={handleResizeMouseDown}
              />
            )}
          </div>
        )}

        {/* Main column */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isMobile && header}
          {!isMobile && header}

          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {isMobile ? (
              contentScrollable ? renderScrollable(mobileBody) : (
                <div className="h-full min-h-0 min-w-0 overflow-hidden">{mobileBody}</div>
              )
            ) : contentScrollable ? renderScrollable(content) : (
              <div className="h-full min-h-0 min-w-0 overflow-hidden">{content}</div>
            )}
          </div>
        </div>
      </div>
    </CollapsibleContext.Provider>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────

const Header: React.FC<
  Omit<React.ComponentPropsWithoutRef<'header'>, 'title'> & {
    title?: ReactNode;
    onBack?: () => void;
    overrideContent?: boolean;
    backAriaLabel?: string;
    subContent?: ReactNode;
  }
> = ({
  children,
  className = '',
  title,
  onBack,
  overrideContent = false,
  backAriaLabel = 'Back',
  subContent,
  ...props
}) => {
  const titleId = useId();
  const { collapsible, collapsed, toggle } = useContext(CollapsibleContext);

  if (overrideContent) {
    return (
      <header className={cn('bg-background border-b px-4 py-2', className)} {...props}>
        {children}
      </header>
    );
  }

  let labelledById: string | undefined;
  if (typeof title === 'string') labelledById = titleId;

  let titleNode: ReactNode;
  if (typeof title === 'string') {
    titleNode = (
      <h1 id={titleId} className="text-sm font-semibold truncate">
        {title}
      </h1>
    );
  } else {
    titleNode = <div className="min-w-0">{title}</div>;
  }

  return (
    <header aria-labelledby={labelledById} className={cn('bg-background border-b px-4 py-2', className)} {...props}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {collapsible && (
            <Button
              aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
              size="icon"
              type="button"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={toggle}
            >
              {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
            </Button>
          )}
          {onBack && (
            <Button aria-label={backAriaLabel} size="icon" type="button" variant="ghost" className="h-7 w-7" onClick={onBack}>
              <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          )}
          {titleNode}
        </div>
        <div className="flex items-center gap-1.5">{children}</div>
      </div>
      {subContent && <div className="mt-1">{subContent}</div>}
    </header>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

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

// ─── Content ──────────────────────────────────────────────────────────────────

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
