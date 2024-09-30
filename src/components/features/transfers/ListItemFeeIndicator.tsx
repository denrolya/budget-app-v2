import React from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { CURRENCY_CODE } from '@/constants/currency.ts';

interface FeeIndicatorProps {
  feeAmount: number;
  feeCurrency: CURRENCY_CODE;
  transferAmount: number;
}

export const FeeIndicator: React.FC<FeeIndicatorProps> = ({ feeAmount, feeCurrency, transferAmount }) => {
  const calculateFeePercentage = () => {
    const feePercentage = (feeAmount / transferAmount) * 100;
    return feePercentage.toFixed(2);
  };

  const feePercentage = calculateFeePercentage();

  const tooltipContent = (
    <p>
      Fee: <MoneyValue useColors={false} amount={feeAmount} currency={feeCurrency} />
      <br />
      ({feePercentage}% of transfer amount)
    </p>
  );

  return (
    <ResponsiveTooltip content={tooltipContent} openDelay={0}>
      <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
    </ResponsiveTooltip>
  );
};

export default FeeIndicator;
