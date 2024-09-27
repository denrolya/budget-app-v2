export enum CURRENCY_CODE {
  EUR = 'EUR',
  USD = 'USD',
  HUF = 'HUF',
  UAH = 'UAH',
  BTC = 'BTC',
  ETH = 'ETH',
}

export const CURRENCIES = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    type: 'fiat',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    type: 'fiat',
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft.',
    name: 'Hungarian Forint',
    type: 'fiat',
  },
  UAH: {
    code: 'UAH',
    symbol: '₴',
    name: 'Ukrainian Hryvnia',
    type: 'fiat',
  },
  BTC: {
    code: 'BTC',
    symbol: 'Ƀ',
    name: 'BitCoin',
    type: 'crypto',
  },
  ETH: {
    code: 'ETH',
    symbol: 'Ξ',
    name: 'Ethereum',
    type: 'crypto',
  },
};
