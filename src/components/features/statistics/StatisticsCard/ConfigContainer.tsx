import React from 'react';

import { cn } from '@/lib/utils';
import ConfigForm from '@/components/features/statistics/StatisticsCard/ConfigForm';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useScreenSize } from '@/hooks/useScreenSize';
import { StatisticsConfig } from '@/types/statistics';

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
  const isDesktop = useScreenSize();
  const ConfigWrapper = isDesktop ? Sheet : Drawer;
  const ConfigHeader = isDesktop ? SheetHeader : DrawerHeader;
  const ConfigTitle = isDesktop ? SheetTitle : DrawerTitle;
  const ConfigDescription = isDesktop ? SheetDescription : DrawerDescription;
  const ConfigTrigger = isDesktop ? SheetTrigger : DrawerTrigger;
  const ConfigContent = isDesktop ? SheetContent : DrawerContent;

  return (
    <ConfigWrapper open={open} onOpenChange={setOpen}>
      <ConfigTrigger asChild>{children}</ConfigTrigger>
      <ConfigContent className={cn({
        'max-w-md overflow-y-auto': isDesktop,
        'max-h-[85vh] flex flex-col': !isDesktop,
      })}>
        <ConfigHeader>
          <ConfigTitle>{title}</ConfigTitle>
          <ConfigDescription className="sr-only">Adjust card settings</ConfigDescription>
          <span className="sr-only">Adjust card settings</span>
        </ConfigHeader>
        <div className={cn({ 'px-4 pb-4 overflow-y-auto': !isDesktop })}>
          <ConfigForm initialConfig={config} onSubmit={onChange} />
        </div>
      </ConfigContent>
    </ConfigWrapper>
  );
};

export default ConfigContainer;
