import moment from 'moment';
import qs from 'qs';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { Type as TransactionType } from '@/types/transaction';
import { generateQueryParamsString } from '@/utils/generateQueryParamsString'; // adjust import based on your file structure

describe('generateQueryParamsString', () => {
  it('should generate query string with default formats and no optional params', () => {
    const after = moment('2023-01-01', 'YYYY-MM-DD');
    const before = moment('2023-12-31', 'YYYY-MM-DD');
    const result = generateQueryParamsString({
      after,
      before,
    });

    expect(result).toBe(qs.stringify({
      after: after.format(BACKEND_DATE_FORMAT),
      before: before.format(BACKEND_DATE_FORMAT),
      interval: undefined,
      type: undefined,
      categories: [],
      accounts: [],
    }, { arrayFormat: 'brackets' }));
  });

  it('should generate query string with custom date formats', () => {
    const after = moment('2023-01-01', 'YYYY-MM-DD');
    const before = moment('2023-12-31', 'YYYY-MM-DD');
    const customFormat = 'MM/DD/YYYY';

    const result = generateQueryParamsString({
      after,
      afterFormat: customFormat,
      before,
      beforeFormat: customFormat,
    });

    expect(result).toBe(qs.stringify({
      after: after.format(customFormat),
      before: before.format(customFormat),
      interval: undefined,
      type: undefined,
      categories: [],
      accounts: [],
    }, { arrayFormat: 'brackets' }));
  });

  it('should handle interval, type, categories, and accounts', () => {
    const after = moment('2023-01-01');
    const before = moment('2023-12-31');
    const interval = 'monthly';
    const type: TransactionType = TransactionType.Expense;
    const categories = ['food', 'transport'];
    const accounts = [1, 2];

    const result = generateQueryParamsString({
      after,
      before,
      interval,
      type,
      categories,
      accounts,
    });

    expect(result).toBe(qs.stringify({
      after: after.format(BACKEND_DATE_FORMAT),
      before: before.format(BACKEND_DATE_FORMAT),
      interval,
      type,
      categories,
      accounts,
    }, { arrayFormat: 'brackets' }));
  });

  it('should handle empty arrays for categories and accounts', () => {
    const after = moment('2023-01-01');
    const before = moment('2023-12-31');
    const result = generateQueryParamsString({
      after,
      before,
      categories: [],
      accounts: [],
    });

    expect(result).toBe(qs.stringify({
      after: after.format(BACKEND_DATE_FORMAT),
      before: before.format(BACKEND_DATE_FORMAT),
      interval: undefined,
      type: undefined,
      categories: [],
      accounts: [],
    }, { arrayFormat: 'brackets' }));
  });

  it('should return empty string when no params are provided', () => {
    const result = generateQueryParamsString({});
    expect(result).toBe('');
  });

  it('should handle null or undefined after and before dates', () => {
    const result = generateQueryParamsString({
      after: undefined,
      before: undefined,
    });

    expect(result).toBe(qs.stringify({
      after: undefined,
      before: undefined,
      interval: undefined,
      type: undefined,
      categories: [],
      accounts: [],
    }, { arrayFormat: 'brackets' }));
  });

  it('should handle null type correctly', () => {
    const after = moment('2023-01-01');
    const before = moment('2023-12-31');
    const result = generateQueryParamsString({
      after,
      before,
      type: undefined,
    });

    expect(result).toBe(qs.stringify({
      after: after.format(BACKEND_DATE_FORMAT),
      before: before.format(BACKEND_DATE_FORMAT),
      interval: undefined,
      type: undefined,
      categories: [],
      accounts: [],
    }, { arrayFormat: 'brackets' }));
  });

  it('should handle numeric categories and accounts', () => {
    const after = moment('2023-01-01');
    const before = moment('2023-12-31');
    const categories = [1, 2, 3];
    const accounts = [100, 200];

    const result = generateQueryParamsString({
      after,
      before,
      categories,
      accounts,
    });

    expect(result).toBe(qs.stringify({
      after: after.format(BACKEND_DATE_FORMAT),
      before: before.format(BACKEND_DATE_FORMAT),
      interval: undefined,
      type: undefined,
      categories,
      accounts,
    }, { arrayFormat: 'brackets' }));
  });

  it('should handle mixed string and numeric categories and accounts', () => {
    const after = moment('2023-01-01');
    const before = moment('2023-12-31');
    const categories = ['food', 'bills'];
    const accounts = ['cash'];

    const result = generateQueryParamsString({
      after,
      before,
      categories,
      accounts,
    });

    expect(result).toBe(qs.stringify({
      after: after.format(BACKEND_DATE_FORMAT),
      before: before.format(BACKEND_DATE_FORMAT),
      interval: undefined,
      type: undefined,
      categories,
      accounts,
    }, { arrayFormat: 'brackets' }));
  });
});
