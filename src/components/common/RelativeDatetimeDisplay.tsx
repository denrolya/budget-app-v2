import moment, { Moment } from 'moment';
import React, { useMemo } from 'react';

type DateFormat = {
  WITH_TIME: {
    CURRENT_YEAR: string;
    OTHER_YEAR: string;
  };
  WITHOUT_TIME: {
    CURRENT_YEAR: string;
    OTHER_YEAR: string;
  };
};

type NumericDateFormat = {
  WITH_TIME: {
    ALL_YEARS: string;
  };
  WITHOUT_TIME: {
    ALL_YEARS: string;
  };
};

const DATE_FORMATS: {
  DEFAULT: DateFormat;
  COMPACT: DateFormat;
  VERBOSE: DateFormat;
  NUMERIC: NumericDateFormat;
} = {
  DEFAULT: {
    WITH_TIME: {
      CURRENT_YEAR: 'MMM D, HH:mm',
      OTHER_YEAR: 'MMM D, YYYY, HH:mm',
    },
    WITHOUT_TIME: {
      CURRENT_YEAR: 'MMM D',
      OTHER_YEAR: 'MMM D, YYYY',
    },
  },
  COMPACT: {
    WITH_TIME: {
      CURRENT_YEAR: 'M/D, HH:mm',
      OTHER_YEAR: 'M/D/YY, HH:mm',
    },
    WITHOUT_TIME: {
      CURRENT_YEAR: 'M/D',
      OTHER_YEAR: 'M/D/YY',
    },
  },
  VERBOSE: {
    WITH_TIME: {
      CURRENT_YEAR: 'dddd, MMMM D, HH:mm',
      OTHER_YEAR: 'dddd, MMMM D, YYYY, HH:mm',
    },
    WITHOUT_TIME: {
      CURRENT_YEAR: 'dddd, MMMM D',
      OTHER_YEAR: 'dddd, MMMM D, YYYY',
    },
  },
  NUMERIC: {
    WITH_TIME: {
      ALL_YEARS: 'DD.MM.YYYY, HH:mm',
    },
    WITHOUT_TIME: {
      ALL_YEARS: 'DD.MM.YYYY',
    },
  },
};

const DAY_STYLES = {
  1: { color: 'bg-red-500', name: 'MON', shortName: 'M' },
  2: { color: 'bg-orange-500', name: 'TUE', shortName: 'T' },
  3: { color: 'bg-yellow-500', name: 'WED', shortName: 'W' },
  4: { color: 'bg-green-500', name: 'THU', shortName: 'T' },
  5: { color: 'bg-sky-500', name: 'FRI', shortName: 'F' },
  6: { color: 'bg-blue-500', name: 'SAT', shortName: 'S' },
  0: { color: 'bg-violet-500', name: 'SUN', shortName: 'S' },
};

const BADGE_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4 text-[8px]',
  md: 'w-5 h-5 text-[10px]',
  lg: 'w-6 h-6 text-xs',
};

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  date: Moment;
  variant?: 'default' | 'compact' | 'verbose' | 'relative' | 'numeric';
  showRelative?: boolean;
  showTime?: boolean;
  showDayBadge?: boolean;
  badgeSize?: keyof typeof BADGE_SIZES;
}

const DateDisplay: React.FC<Props> = ({
  date,
  variant = 'default',
  showRelative = true,
  showTime = true,
  showDayBadge = false,
  badgeSize = 'sm',
  className,
}) => {
  const isCurrentYear = date.year() === moment().year();

  const formattedDate = useMemo(() => {
    if (variant === 'relative') {
      return date.fromNow();
    }

    const formatObj = DATE_FORMATS[variant.toUpperCase() as keyof typeof DATE_FORMATS];
    const timeObj = showTime ? formatObj.WITH_TIME : formatObj.WITHOUT_TIME;

    if (variant === 'numeric') {
      return date.format((timeObj as NumericDateFormat['WITH_TIME']).ALL_YEARS);
    }

    const format = isCurrentYear ? timeObj.CURRENT_YEAR : timeObj.OTHER_YEAR;
    return date.format(format);
  }, [date, isCurrentYear, variant, showTime]);

  const relativeTime = useMemo(() => {
    const now = moment();
    const diffHours = date.diff(now, 'hours');
    const diffDays = date.diff(now, 'days');

    if (Math.abs(diffHours) < 1) return 'just now';
    if (diffHours === 1) return 'in 1 hour';
    if (diffHours > 1 && diffHours <= 6) return `in ${diffHours} hours`;
    if (diffHours > 6 && diffHours < 24) return 'later today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays === -1) return 'yesterday';
    return date.fromNow();
  }, [date]);

  const dayVisual = useMemo(() => {
    const dayOfWeek = date.day();
    const { color, name, shortName } = DAY_STYLES[dayOfWeek as keyof typeof DAY_STYLES];
    const sizeClass = BADGE_SIZES[badgeSize];

    return (
      <span
        className={`inline-flex items-center justify-center ${sizeClass} rounded-full font-normal text-white ${color} mr-2 shadow-md`}
      >
        {badgeSize !== 'xs' && (badgeSize === 'sm' ? shortName : name)}
      </span>
    );
  }, [date, badgeSize]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      {showDayBadge && dayVisual}
      <span className="inline-flex items-center">
        <span className={`font-medium ${variant === 'verbose' ? 'text-base' : 'text-sm'}`}>{formattedDate}</span>
        {showRelative && variant !== 'relative' && (
          <span className="text-xs font-light text-gray-400 ml-2">({relativeTime})</span>
        )}
      </span>
    </span>
  );
};

export default DateDisplay;
