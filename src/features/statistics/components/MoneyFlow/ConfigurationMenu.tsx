import { History, SettingsIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Switch from '@/features/statistics/components/MoneyFlow/ConfigurationMenuSwitch';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  showPreviousPeriod: boolean;
  setShowPreviousPeriod: (value: boolean) => void;
}

const MenuContent: React.FC<Props> = ({ showPreviousPeriod, setShowPreviousPeriod }) => (
  <div>
    <Switch checked={showPreviousPeriod} icon={History} label="Previous Period" onChange={setShowPreviousPeriod} />
  </div>
);

const ConfigurationMenu: React.FC<Props> = (props) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7 p-0">
            <SettingsIcon className="h-3.5 w-3.5" />
            <span className="sr-only">Chart overlays and boundaries</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-3">
          <MenuContent {...props} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 p-0">
          <SettingsIcon className="h-3.5 w-3.5" />
          <span className="sr-only">Chart overlays and boundaries</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-6">
        <DrawerHeader>
          <DrawerTitle>Chart Options</DrawerTitle>
          <DrawerDescription className="sr-only">MoneyFlow overlay and boundary settings</DrawerDescription>
        </DrawerHeader>
        <MenuContent {...props} />
      </DrawerContent>
    </Drawer>
  );
};

export default ConfigurationMenu;
