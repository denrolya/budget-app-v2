import { ChevronLeft } from 'lucide-react';
import React, { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useScreenSize } from '@/hooks/useScreenSize';
import { cn } from '@/lib/utils';

type PageWithSidebarProps = React.ComponentPropsWithoutRef<'div'> & {
  sidebarWidth?: string
  contentScrollable?: boolean
  children: ReactNode
}

type PageWithSidebarComponent = React.FC<PageWithSidebarProps> & {
  Header: React.FC<React.ComponentPropsWithoutRef<'header'> & { title?: string, onBack?: () => void }>
  Sidebar: React.FC<React.ComponentPropsWithoutRef<'aside'>>
  Content: React.FC<React.ComponentPropsWithoutRef<'main'>>
}

const PageWithSidebar: PageWithSidebarComponent = ({
                                                     children,
                                                     className = '',
                                                     sidebarWidth = 'w-80',
                                                     contentScrollable = true,
                                                     ...props
                                                   }) => {
  const isDesktop = useScreenSize();
  const childrenArray = React.Children.toArray(children);
  const header = childrenArray.find(child => React.isValidElement(child) && child.type === PageWithSidebar.Header);
  const sidebar = childrenArray.find(child => React.isValidElement(child) && child.type === PageWithSidebar.Sidebar);
  const content = childrenArray.find(child => React.isValidElement(child) && child.type === PageWithSidebar.Content);

  const renderContent = () => {
    if (isDesktop) {
      return content;
    }
    if (header) {
      return content;
    }
    return sidebar || content;
  };

  return (
    <div className={cn('flex h-screen md:h-[calc(100vh-2rem)] overflow-hidden pb-16 md:pb-0', className)} {...props}>
      {isDesktop && (
        <div className={cn('border-r bg-background', sidebarWidth)}>
          <ScrollArea className="h-full">{sidebar}</ScrollArea>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {header}
        <div className="flex-1 overflow-hidden">
          {contentScrollable ? (
            <ScrollArea className="h-full">
              {renderContent()}
            </ScrollArea>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<React.ComponentPropsWithoutRef<'header'> & { title?: string, onBack?: () => void }> = ({
                                                                                                                children,
                                                                                                                className = '',
                                                                                                                title,
                                                                                                                onBack,
                                                                                                                ...props
                                                                                                              }) => (
  <header className={cn('bg-background border-b p-4 flex justify-between items-center', className)} {...props}>
    <div className="flex items-center">
      <Button variant="ghost" size="icon" className="mr-2" onClick={onBack} aria-label="Back to list">
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
    <div className="flex space-x-2">
      {children}
    </div>
  </header>
);

const Sidebar: React.FC<React.ComponentPropsWithoutRef<'aside'>> = ({ children, className = '', ...props }) => (
  <aside className={cn('flex flex-col h-full', className)} {...props}>
    {children}
  </aside>
);

const Content: React.FC<React.ComponentPropsWithoutRef<'main'>> = ({ children, className = '', ...props }) => (
  <main className={cn('h-full', className)} {...props}>
    {children}
  </main>
);

PageWithSidebar.Header = Header;
PageWithSidebar.Sidebar = Sidebar;
PageWithSidebar.Content = Content;

export default PageWithSidebar;
