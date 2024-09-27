import { CURRENCY_CODE } from '@/constants/currency';

export interface User {
  username: string;
  roles: string[];
  exp: number;
  iat: number;
  baseCurrency: CURRENCY_CODE;
}

export default User;
