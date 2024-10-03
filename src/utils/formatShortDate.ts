import moment, { Moment } from 'moment';

export const formatShortDate = (date: Moment) => {
  const currentYear = moment().year();
  return date.year() === currentYear ? date.format('MMM D') : date.format('MMM D, YYYY');
};
