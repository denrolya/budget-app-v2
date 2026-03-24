import moment from 'moment';

import { generatePreviousTimeframe } from '@/lib/datetime/generatePreviousTimeframe';
import type { IntervalUnit } from '@/types/statistics';

describe('generatePreviousTimeframe', () => {
  it('should throw an error if startDate is invalid', () => {
    const invalidStart = moment.invalid();
    const validEnd = moment('2024-10-15');

    expect(() => generatePreviousTimeframe(invalidStart, validEnd, 'day')).toThrow('Invalid startDate provided.');
  });

  it('should throw an error if endDate is invalid', () => {
    const validStart = moment('2024-10-01');
    const invalidEnd = moment.invalid();

    expect(() => generatePreviousTimeframe(validStart, invalidEnd, 'day')).toThrow('Invalid endDate provided.');
  });

  it('should throw an error if unit is invalid', () => {
    const start = moment('2024-10-01');
    const end = moment('2024-10-15');

    expect(() => generatePreviousTimeframe(start, end, 'invalidUnit' as unknown as IntervalUnit)).toThrow(
      'Invalid unit provided. Allowed units are: day, week, month, year',
    );
  });

  it('should throw an error if startDate is after endDate', () => {
    const start = moment('2024-10-16');
    const end = moment('2024-10-15');

    expect(() => generatePreviousTimeframe(start, end, 'day')).toThrow('startDate must not be after endDate.');
  });

  it('should throw an error if the date range does not span at least one unit', () => {
    const start = moment('2024-10-01');
    const end = moment('2024-10-01');

    expect(() => generatePreviousTimeframe(start, end, 'month')).toThrow('The date range must span at least one unit.');
  });

  it('should return the previous ISO week (Mon-Sun)', () => {
    const start = moment('2024-10-07'); // Monday of the current week
    const end = moment('2024-10-13'); // Sunday of the current week

    const result = generatePreviousTimeframe(start, end);

    expect(result.previousStart.format('YYYY-MM-DD')).toBe('2024-09-30'); // Previous week start (Mon)
    expect(result.previousEnd.format('YYYY-MM-DD')).toBe('2024-10-06'); // Previous week end (Sun)
  });

  it('should return the previous month', () => {
    const start = moment('2024-10-01'); // Start of October
    const end = moment('2024-10-31'); // End of October

    const result = generatePreviousTimeframe(start, end);

    expect(result.previousStart.format('YYYY-MM-DD')).toBe('2024-09-01'); // Start of September
    expect(result.previousEnd.format('YYYY-MM-DD')).toBe('2024-09-30'); // End of September
  });

  it('should return the previous year', () => {
    const start = moment('2024-01-01'); // Start of the year
    const end = moment('2024-12-31'); // End of the year

    const result = generatePreviousTimeframe(start, end);

    expect(result.previousStart.format('YYYY-MM-DD')).toBe('2023-01-01'); // Start of previous year
    expect(result.previousEnd.format('YYYY-MM-DD')).toBe('2023-12-31'); // End of previous year
  });

  it('should return the previous custom period based on day difference', () => {
    const start = moment('2024-10-01'); // Random start date
    const end = moment('2024-10-15'); // Random end date

    const result = generatePreviousTimeframe(start, end, 'day');

    expect(result.previousStart.format('YYYY-MM-DD')).toBe('2024-09-16'); // 15-day diff applied backward
    expect(result.previousEnd.format('YYYY-MM-DD')).toBe('2024-09-30'); // 15-day diff applied backward
  });

  it('should return the previous custom period based on week difference', () => {
    const start = moment('2024-10-01'); // Random start date
    const end = moment('2024-10-15'); // Random end date

    const result = generatePreviousTimeframe(start, end, 'week');

    expect(result.previousStart.format('YYYY-MM-DD')).toBe('2024-09-17'); // 2-week diff applied backward
    expect(result.previousEnd.format('YYYY-MM-DD')).toBe('2024-09-30'); // 2-week diff applied backward
  });

  it('should return the previous custom period when unit is "years"', () => {
    const start = moment('2020-01-01'); // Random start date
    const end = moment('2025-01-01'); // Random end date

    const result = generatePreviousTimeframe(start, end, 'year');

    expect(result.previousStart.format('YYYY-MM-DD')).toBe('2015-01-01'); // 5 years backward
    expect(result.previousEnd.format('YYYY-MM-DD')).toBe('2019-12-31'); // 5 years backward
  });

  it('should handle non-standard timeframes by defaulting to day difference', () => {
    const start = moment('2024-10-10'); // Random start date
    const end = moment('2024-10-14'); // 5 days after

    const result = generatePreviousTimeframe(start, end);

    expect(result.previousStart.format('YYYY-MM-DD')).toBe('2024-10-05'); // 5 days backward
    expect(result.previousEnd.format('YYYY-MM-DD')).toBe('2024-10-09'); // 5 days backward
  });
});
