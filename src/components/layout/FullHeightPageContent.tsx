import React from 'react';

import { cn } from '@/lib/utils';

interface Props extends React.ComponentPropsWithoutRef<'section'> {
  children: React.ReactNode;
  pageTitle?: React.ReactNode;
  pageHeaderRight?: React.ReactNode;
}

export const FullHeightPageContent = React.forwardRef<HTMLElement, Props>(
  ({ className, children, pageTitle, pageHeaderRight, ...props }, ref) => (
    <section
      role="main"
      className={cn(
        'w-full min-h-0 flex flex-col h-[calc(100dvh-3rem)] md:h-full p-2 md:p-4 overflow-hidden',
        className,
      )}
      ref={ref}
      {...props}
    >
      {(pageTitle || pageHeaderRight) && (
        <header className="shrink-0 mb-2 md:mb-3 flex items-center justify-between gap-3">
          {pageTitle ? <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1> : <div />}
          {pageHeaderRight}
        </header>
      )}
      {children}
    </section>
  ),
);

FullHeightPageContent.displayName = 'FullHeightPageContent';

export default FullHeightPageContent;
