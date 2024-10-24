import { Moment } from 'moment';
import qs from 'qs';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { Type as TransactionType } from '@/types/transaction';

export const generateQueryParamsString = ({
                                            after,
                                            afterFormat = BACKEND_DATE_FORMAT,
                                            before,
                                            beforeFormat = BACKEND_DATE_FORMAT,
                                            period,
                                            type = null,
                                            categories = [],
                                            accounts = [],
                                          }: {
  after?: Moment;
  afterFormat?: string;
  before?: Moment;
  beforeFormat?: string;
  period?: string;
  type?: TransactionType | null;
  categories?: string[] | number[];
  accounts?: string[] | number[];
}):
  string => qs.stringify(
  {
    after: after?.format(afterFormat),
    before: before?.format(beforeFormat),
    interval: period,
    type: type || undefined,
    categories,
    accounts,
  },
  { arrayFormat: 'brackets' },
);
