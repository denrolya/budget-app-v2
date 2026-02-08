import React from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { CURRENCY_CODE } from '@/constants/currency';

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
      Fee: <MoneyValue amount={feeAmount} currency={feeCurrency} useColors={false} />
      <br />({feePercentage}% of transfer amount)
    </p>
  );

  return (
    <ResponsiveTooltip openDelay={0} content={tooltipContent}>
      <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
    </ResponsiveTooltip>
  );
};

export default FeeIndicator;
