import moment, { Moment } from 'moment';

import { IntervalUnit } from '@/types/statistics';

export const generatePreviousTimeframe = (
  startDate: Moment,
  endDate: Moment,
  unit: IntervalUnit = IntervalUnit.Day,
): { previousStart: Moment; previousEnd: Moment } => {

  if (!moment.isMoment(startDate) || !startDate.isValid()) {
    throw new Error('Invalid startDate provided.');
  }

  if (!moment.isMoment(endDate) || !endDate.isValid()) {
    throw new Error('Invalid endDate provided.');
  }

  const allowedUnits = ['day', 'week', 'month', 'year'];
  if (!allowedUnits.includes(unit)) {
    throw new Error(`Invalid unit provided. Allowed units are: ${allowedUnits.join(', ')}`);
  }

  if (startDate.isAfter(endDate)) {
    throw new Error('startDate must not be after endDate.');
  }

  let previousStart: Moment;
  let previousEnd: Moment;

  if (
    startDate.isSame(startDate.clone().startOf('year')) &&
    endDate.isSame(endDate.clone().endOf('year'))
  ) {
    // Whole years
    const yearsSpan = endDate.year() - startDate.year() + 1;
    previousStart = startDate.clone().subtract(yearsSpan, 'years').startOf('year');
    previousEnd = endDate.clone().subtract(yearsSpan, 'years').endOf('year');
  } else if (startDate.date() === 1 && endDate.isSame(endDate.clone().endOf('month'), 'day')) {
    // Whole months
    const monthsSpan = (endDate.year() - startDate.year()) * 12 + endDate.month() - startDate.month() + 1;
    previousStart = startDate.clone().subtract(monthsSpan, 'months').startOf('month');
    previousEnd = endDate.clone().subtract(monthsSpan, 'months').endOf('month');
  } else if (startDate.isoWeekday() === 1 && endDate.isoWeekday() === 7) {
    // Whole ISO weeks (Monday to Sunday)
    const startWeek = startDate.isoWeek();
    const endWeek = endDate.isoWeek();
    const startYear = startDate.isoWeekYear();
    const endYear = endDate.isoWeekYear();

    let weeksSpan = 0;
    if (startYear === endYear) {
      weeksSpan = endWeek - startWeek + 1;
    } else {
      // Calculate weeks across years
      const weeksInStartYear = moment(`${startYear}-12-31`).isoWeek();
      weeksSpan = (weeksInStartYear - startWeek + 1) + ((endYear - startYear - 1) * 52) + endWeek;
    }

    previousStart = startDate.clone().subtract(weeksSpan, 'weeks').startOf('isoWeek');
    previousEnd = endDate.clone().subtract(weeksSpan, 'weeks').endOf('isoWeek');
  } else {
    // Generic case
    let diff = endDate.diff(startDate, unit);
    if (unit === 'day') {
      diff += 1;
    }
    if (diff <= 0) {
      throw new Error('The date range must span at least one unit.');
    }
    previousStart = startDate.clone().subtract(diff, unit);
    previousEnd = startDate.clone().subtract(1, 'days');
  }

  return { previousStart, previousEnd };
};
