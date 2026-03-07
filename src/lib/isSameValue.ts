import isEqual from 'lodash/isEqual';
import moment from 'moment';

export const isSameValue = (a: any, b: any): boolean =>
  moment.isMoment(a) && moment.isMoment(b) ? a.isSame(b, 'day') : isEqual(a, b);
