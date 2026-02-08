import { type LucideIcon } from 'lucide-react';
import React, { ReactNode, useId } from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props {
  label: string;
  icon: ReactNode | LucideIcon;
  checked: boolean;
  onChange: (checked: boolean) => void;
  iconClassName?: string;
}


const ConfigurationMenuSwitch: React.FC<Props> = ({ label, icon: Icon, checked, onChange, iconClassName }) => {
  const id = useId();

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="flex items-center space-x-2 text-xs cursor-pointer">
        <Icon className={`h-3 w-3 ${iconClassName}`} />
        <span>{label}</span>
      </Label>
      <Switch
        checked={checked}
        id={id}
        className="scale-75"
        onCheckedChange={onChange}
      />
    </div>
  );
};

export default ConfigurationMenuSwitch;
