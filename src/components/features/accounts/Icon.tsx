import { CreditCard, Globe, HelpCircle, Wallet } from 'lucide-react';
import { FC } from 'react';

export const AccountIcon: FC<{ type: string; color: string }> = ({ type, color }) => {
  const IconComponent = {
    bank: CreditCard,
    cash: Wallet,
    internet: Globe,
    other: HelpCircle,
  }[type] || HelpCircle;

  return (
    <div
      className="rounded-full p-2 flex items-center justify-center"
      style={{ backgroundColor: color, width: '2.5rem', height: '2.5rem' }}
    >
      <IconComponent className="h-4 w-4 text-white" />
    </div>
  );
};
