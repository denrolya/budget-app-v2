import React from 'react';

import { cn } from '@/lib/utils';

interface Props extends React.ComponentPropsWithoutRef<'section'> {
  children: React.ReactNode;
}

export const FullHeightPageContent = React.forwardRef<HTMLElement, Props>(
  ({ className, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('w-full h-[calc(100vh-3rem)] p-4 mx-auto overflow-hidden', className)}
      {...props}
    >
      {children}
    </section>
  )
);

FullHeightPageContent.displayName = 'FullHeightPageContent';

export default FullHeightPageContent;
