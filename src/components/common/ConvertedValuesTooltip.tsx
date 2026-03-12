import React from 'react';

import ResponsiveTooltip from '@/components/ui/responsive-tooltip';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { formatMoney as formatMoneyValue } from '@/lib/formatMoney';
import { cn } from '@/lib/utils';

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
  const formatMoney = (value: number, currency: CURRENCY_CODE) => {
    const symbol = CURRENCIES[currency]?.symbol ?? currency;
    return `${symbol} ${formatMoneyValue(value, currency, decimals)}`;
  };

  const entries = Object.entries(convertedValues);
  const original = entries.find(([code]) => code === originalCurrency);
  const conversions = entries.filter(([code]) => code !== originalCurrency);

  return (
    <ResponsiveTooltip
      desktopComponent="hovercard"
      content={
        <div className="min-w-[160px] text-xs space-y-2">
          {original && (
            <div className="flex items-center justify-between gap-4 border-l-2 border-primary pl-2">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                {original[0]}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatMoney(original[1], original[0] as CURRENCY_CODE)}
              </span>
            </div>
          )}
          {conversions.length > 0 && (
            <div className="space-y-1 pt-0.5">
              {original && <div className="h-px bg-border -mx-1" />}
              {conversions.map(([code, val]) => (
                <div className="flex items-center justify-between gap-4" key={code}>
                  <span
                    className={cn(
                      'font-mono text-[10px] tracking-widest uppercase',
                      code === originalCurrency ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {code}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    ≈ {formatMoney(val, code as CURRENCY_CODE)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      }
      contentClassName="p-3 rounded-lg"
      triggerClassName="cursor-help"
    >
      {children}
    </ResponsiveTooltip>
  );
};

export default ConvertedCurrenciesTooltip;
