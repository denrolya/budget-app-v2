import React from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { type StatisticsConfig } from '@/types/statistics';
import ConfigForm from '@/features/statistics/components/StatisticsCard/ConfigForm';

interface ConfigContainerProps {
  open?: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  onChange: (newConfig: Partial<StatisticsConfig>) => void;
  config: StatisticsConfig;
  children: React.ReactNode;
}

const ConfigContainer: React.FC<ConfigContainerProps> = ({
  open = false,
  setOpen,
  title,
  onChange,
  config,
  children,
}) => {
  const isMobile = useIsMobile();
  const ConfigWrapper = !isMobile ? Sheet : Drawer;
  const ConfigHeader = !isMobile ? SheetHeader : DrawerHeader;
  const ConfigTitle = !isMobile ? SheetTitle : DrawerTitle;
  const ConfigDescription = !isMobile ? SheetDescription : DrawerDescription;
  const ConfigTrigger = !isMobile ? SheetTrigger : DrawerTrigger;
  const ConfigContent = !isMobile ? SheetContent : DrawerContent;

  return (
    <ConfigWrapper open={open} onOpenChange={setOpen}>
      <ConfigTrigger asChild>{children}</ConfigTrigger>
      <ConfigContent
        className={cn({
          'max-w-md overflow-y-auto': !isMobile,
          'max-h-[85vh] flex flex-col': isMobile,
        })}
      >
        <ConfigHeader>
          <ConfigTitle>{title}</ConfigTitle>
          <ConfigDescription className="sr-only">Adjust card settings</ConfigDescription>
          <span className="sr-only">Adjust card settings</span>
        </ConfigHeader>
        <div className={cn({ 'px-4 pb-4 overflow-y-auto': isMobile })}>
          <ConfigForm initialConfig={config} onSubmit={onChange} />
        </div>
      </ConfigContent>
    </ConfigWrapper>
  );
};

export default ConfigContainer;
