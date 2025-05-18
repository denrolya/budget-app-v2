import { describe, expect, it } from 'vitest';

import { CURRENCY_CODE } from '@/constants/currency';
import { formatTransferExchangeRate } from '@/utils/formatTransferExchangeRate';

describe('formatTransferExchangeRate', () => {
  it('handles UAH to BTC conversion', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.UAH, CURRENCY_CODE.BTC], 1234567.8901);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.BTC, amount: 1 },
      { currency: CURRENCY_CODE.UAH, amount: 1234567.8901 },
    ]);
  });

  it('handles HUF to BTC conversion', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.HUF, CURRENCY_CODE.BTC], 999999.9999);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.BTC, amount: 1 },
      { currency: CURRENCY_CODE.HUF, amount: 999999.9999 },
    ]);
  });

  it('handles EUR to HUF conversion (default case)', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.EUR, CURRENCY_CODE.HUF], 394.1234);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.EUR, amount: 1 },
      { currency: CURRENCY_CODE.HUF, amount: 394.1234 },
    ]);
  });

  it('handles identical currencies', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.USD, CURRENCY_CODE.USD], 1);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.USD, amount: 1 },
      { currency: CURRENCY_CODE.USD, amount: 1 },
    ]);
  });

  it('handles zero rate conversion', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.EUR, CURRENCY_CODE.UAH], 0);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.EUR, amount: 1 },
      { currency: CURRENCY_CODE.UAH, amount: 0 },
    ]);
  });

  it('handles very small rate', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.USD, CURRENCY_CODE.BTC], 0.00002345);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.USD, amount: 1 },
      { currency: CURRENCY_CODE.BTC, amount: 0.0 },
    ]);
  });

  it('handles large rate conversion', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.USD, CURRENCY_CODE.UAH], 99999.9999);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.USD, amount: 1 },
      { currency: CURRENCY_CODE.UAH, amount: 99999.9999 },
    ]);
  });

  it('handles reversed HUF-UAH conversion correctly', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.HUF, CURRENCY_CODE.UAH], 0.0734);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.HUF, amount: 1 },
      { currency: CURRENCY_CODE.UAH, amount: 0.0734 },
    ]);
  });

  it('handles reversed EUR-UAH conversion correctly', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.EUR, CURRENCY_CODE.UAH], 39.4567);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.EUR, amount: 1 },
      { currency: CURRENCY_CODE.UAH, amount: 39.4567 },
    ]);
  });

  it('rounds amounts correctly to specified decimals', () => {
    const result = formatTransferExchangeRate([CURRENCY_CODE.UAH, CURRENCY_CODE.HUF], 44.2579);
    expect(result).toEqual([
      { currency: CURRENCY_CODE.HUF, amount: 1000 },
      { currency: CURRENCY_CODE.UAH, amount: 44.26 }, // Rounded correctly
    ]);
  });
});
