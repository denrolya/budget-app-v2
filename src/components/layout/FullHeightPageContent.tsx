import React from 'react';

import { cn } from '@/lib/utils';

interface Props extends React.ComponentPropsWithoutRef<'section'> {
  children: React.ReactNode;
}

export const FullHeightPageContent: React.FC<Props> = ({ className, children, ...props }) => (
  <section className={cn('w-full h-[calc(100vh-2rem)] overflow-hidden p-4 mx-auto', className)} {...props}>
    {children}
  </section>
);

FullHeightPageContent.displayName = 'FullHeightPageContent';

export default FullHeightPageContent;
