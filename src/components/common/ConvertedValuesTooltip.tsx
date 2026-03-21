import React, { useMemo } from 'react';

import ResponsiveTooltip from '@/components/ui/responsive-tooltip';
import { CURRENCY_DISPLAY_ORDER, type CURRENCY_CODE } from '@/constants/currency';
import { formatMoneyWithSymbol } from '@/lib/formatMoney';

interface ConvertedCurrenciesTooltipProps {
  originalCurrency: CURRENCY_CODE;
  /** Native amount in originalCurrency — always shown first regardless of convertedValues keys. */
  originalAmount: number;
  convertedValues: Record<string, number>;
  decimals?: number;
  children: React.ReactNode;
}

const ConvertedCurrenciesTooltip: React.FC<ConvertedCurrenciesTooltipProps> = ({
  originalCurrency,
  originalAmount,
  convertedValues,
  decimals,
  children,
}) => {
  const conversions = useMemo(
    () =>
      Object.entries(convertedValues)
        .filter(([code]) => code !== originalCurrency)
        .sort(([a], [b]) => {
          const ai = CURRENCY_DISPLAY_ORDER.indexOf(a as CURRENCY_CODE);
          const bi = CURRENCY_DISPLAY_ORDER.indexOf(b as CURRENCY_CODE);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        }),
    [convertedValues, originalCurrency],
  );

  return (
    <ResponsiveTooltip
      desktopComponent="hovercard"
      content={
        <div className="font-mono min-w-[148px]">
          {/* Original currency — always first, always highlighted */}
          <div className="flex items-center justify-between gap-5">
            <span className="text-2xs tracking-widest text-muted-foreground">{originalCurrency}</span>
            <span className="text-xs tabular-nums font-semibold text-foreground">
              {formatMoneyWithSymbol(originalAmount, originalCurrency, decimals)}
            </span>
          </div>

          {conversions.length > 0 && <div className="h-px bg-border my-1.5 -mx-2.5" />}

          <div className="space-y-0.5">
            {conversions.map(([code, val]) => (
              <div className="flex items-center justify-between gap-5" key={code}>
                <span className="text-2xs tracking-widest text-muted-foreground/60">{code}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  ≈ {formatMoneyWithSymbol(val, code as CURRENCY_CODE, decimals)}
                </span>
              </div>
            ))}
          </div>
        </div>
      }
      contentClassName="px-2.5 py-2 rounded"
      triggerClassName="cursor-help"
    >
      {children}
    </ResponsiveTooltip>
  );
};

export default ConvertedCurrenciesTooltip;
