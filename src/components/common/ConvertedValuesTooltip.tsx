import React from 'react';

import ResponsiveTooltip from '@/components/ui/responsive-tooltip';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { cn } from '@/lib/utils';
import { formatMoney as formatMoneyValue } from '@/utils/formatMoney';

interface ConvertedCurrenciesTooltipProps {
  originalCurrency: CURRENCY_CODE;
  convertedValues: Record<string, number>;
  decimals?: number;
  children: React.ReactNode;
}

const ConvertedCurrenciesTooltip: React.FC<ConvertedCurrenciesTooltipProps> = ({
  originalCurrency,
  convertedValues,
  decimals,
  children,
}) => {
  const formatMoney = (value: number, currency: CURRENCY_CODE, symbol: string) =>
    `${symbol} ${formatMoneyValue(value, currency, decimals)}`;

  return (
    <ResponsiveTooltip
      contentClassName="p-2 rounded-lg"
      triggerClassName="cursor-help"
      desktopComponent="hovercard"
      content={
        <ul>
          {Object.entries(convertedValues).map(([code, val]) => {
            const currencyData = CURRENCIES[code];
            const currencySymbol = currencyData?.symbol || '';
            const formatted = formatMoney(val, code, currencySymbol);
            const isOriginal = code === originalCurrency;
            return (
              <li
                key={code}
                className={cn('flex justify-between items-center p-1 rounded', {
                  'bg-warning/10 border border-warning font-semibold': isOriginal,
                })}
              >
                <div className="flex items-center space-x-1">
                  <span>{code}</span>
                </div>
                <span className="font-numeric text-xs">{formatted}</span>
              </li>
            );
          })}
        </ul>
      }
    >
      {children}
    </ResponsiveTooltip>
  );
};

export default ConvertedCurrenciesTooltip;
