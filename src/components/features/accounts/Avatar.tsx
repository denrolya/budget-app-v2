import React from 'react';
import cn from 'classnames';

import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Account {
  id: string;
  name: string;
  icon?: string;
  color: string;
}

interface AvatarProps {
  account: Account;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ account, className }) => {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const accountIcon = account.icon ? (
    <i className={`${account.icon} text-lg`}></i>
  ) : (
    getInitials(account.name)
  );

  return (
    <AvatarComponent className={cn('h-10 w-10', className)} style={{ backgroundColor: account.color }}>
      <AvatarImage src={`https://www.gravatar.com/avatar/${account.id}?d=identicon&s=40`} alt={account.name} />
      <AvatarFallback>{accountIcon}</AvatarFallback>
    </AvatarComponent>
  );
};
