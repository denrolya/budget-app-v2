import { Bitcoin, DollarSign, Euro } from 'lucide-react';
import type React from 'react';
import { FaEthereum } from 'react-icons/fa';

export enum CURRENCY_CODE {
  EUR = 'EUR',
  USD = 'USD',
  HUF = 'HUF',
  UAH = 'UAH',
  BTC = 'BTC',
  ETH = 'ETH',
}

interface Currency {
  code: CURRENCY_CODE;
  symbol: string;
  icon?: React.ComponentType;
  name: string;
  type: 'fiat' | 'crypto';
}

/** Canonical display order for multi-currency tooltips and lists. */
export const CURRENCY_DISPLAY_ORDER: CURRENCY_CODE[] = [
  CURRENCY_CODE.EUR,
  CURRENCY_CODE.USD,
  CURRENCY_CODE.HUF,
  CURRENCY_CODE.UAH,
  CURRENCY_CODE.BTC,
  CURRENCY_CODE.ETH,
];

export const CURRENCIES: Record<CURRENCY_CODE, Currency> = {
  EUR: {
    code: CURRENCY_CODE.EUR,
    symbol: '€',
    icon: Euro,
    name: 'Euro',
    type: 'fiat',
  },
  USD: {
    code: CURRENCY_CODE.USD,
    symbol: '$',
    icon: DollarSign,
    name: 'US Dollar',
    type: 'fiat',
  },
  HUF: {
    code: CURRENCY_CODE.HUF,
    symbol: 'Ft.',
    name: 'Hungarian Forint',
    type: 'fiat',
  },
  UAH: {
    code: CURRENCY_CODE.UAH,
    symbol: '₴',
    name: 'Ukrainian Hryvnia',
    type: 'fiat',
  },
  BTC: {
    code: CURRENCY_CODE.BTC,
    symbol: 'Ƀ',
    icon: Bitcoin,
    name: 'BitCoin',
    type: 'crypto',
  },
  ETH: {
    code: CURRENCY_CODE.ETH,
    symbol: 'Ξ',
    icon: FaEthereum,
    name: 'Ethereum',
    type: 'crypto',
  },
};

/** Options array for currency multi-selects. */
export const CURRENCY_OPTIONS = (Object.keys(CURRENCIES) as CURRENCY_CODE[]).map((code) => ({
  value: code,
  label: `${CURRENCIES[code].symbol} ${code}`,
}));
