import React from 'react';

import { cn } from '@/lib/utils';

interface Props extends React.ComponentPropsWithoutRef<'section'> {
  children: React.ReactNode;
}

export const FullHeightPageContent = React.forwardRef<HTMLElement, Props>(({ className, children, ...props }, ref) => (
  <section
    role="main"
    className={cn('w-full min-h-0 flex flex-col h-[calc(100dvh-3rem)] md:h-full p-2 md:p-4 overflow-hidden', className)}
    ref={ref}
    {...props}
  >
    {children}
  </section>
));

FullHeightPageContent.displayName = 'FullHeightPageContent';

export default FullHeightPageContent;
