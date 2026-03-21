import moment from 'moment';

import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';

/**
 * Normalise a date value (moment, string, Date, null) to `YYYY-MM-DDTHH:mm`
 * for use in `<input type="datetime-local">`. Returns '' for falsy/invalid input.
 */
export const toDatetimeLocal = (value: unknown): string => {
  if (!value) return '';

  // Already in the correct format
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
    // Trim seconds/timezone from ISO strings
    if (value.includes('T')) return value.slice(0, 16);
  }

  // Moment object or anything moment can parse
  const m = moment(value as string | number | Date);
  return m.isValid() ? m.format(MOMENT_DATETIME_FORM_FORMAT) : '';
};

/** Shortcut: current datetime in `YYYY-MM-DDTHH:mm` format. */
export const nowDatetimeLocal = (): string => moment().format(MOMENT_DATETIME_FORM_FORMAT);
