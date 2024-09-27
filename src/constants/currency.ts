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
  name: string;
  type: 'fiat' | 'crypto';
}

export const CURRENCIES: Record<CURRENCY_CODE, Currency> = {
  EUR: {
    code: CURRENCY_CODE.EUR,
    symbol: '€',
    name: 'Euro',
    type: 'fiat',
  },
  USD: {
    code: CURRENCY_CODE.USD,
    symbol: '$',
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
    name: 'BitCoin',
    type: 'crypto',
  },
  ETH: {
    code: CURRENCY_CODE.ETH,
    symbol: 'Ξ',
    name: 'Ethereum',
    type: 'crypto',
  },
};
