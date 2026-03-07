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
  1: { color: 'bg-red-700', name: 'MON', shortName: 'M' },
  2: { color: 'bg-orange-700', name: 'TUE', shortName: 'T' },
  3: { color: 'bg-yellow-700', name: 'WED', shortName: 'W' },
  4: { color: 'bg-green-700', name: 'THU', shortName: 'T' },
  5: { color: 'bg-sky-700', name: 'FRI', shortName: 'F' },
  6: { color: 'bg-blue-700', name: 'SAT', shortName: 'S' },
  0: { color: 'bg-violet-700', name: 'SUN', shortName: 'S' },
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

    const format = isCurrentYear ? (timeObj as DateFormat['WITH_TIME']).CURRENT_YEAR : (timeObj as DateFormat['WITH_TIME']).OTHER_YEAR;
    return date.format(format);
  }, [date, isCurrentYear, variant, showTime]);

  const relativeTime = useMemo(() => {
    const now = moment();

    if (date.isSame(now, 'day')) return 'today';
    if (date.isSame(now.clone().subtract(1, 'day'), 'day')) return 'yesterday';
    if (date.isSame(now.clone().add(1, 'day'), 'day')) return 'tomorrow';

    const diffDays = date.startOf('day').diff(now.startOf('day'), 'days');
    if (Math.abs(diffDays) <= 6) return date.format('ddd'); // Mon/Tue/...

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
      <>
        <span>{formattedDate}</span>
        {showRelative && variant !== 'relative' && (
          <small className="font-light text-muted-foreground ml-1">({relativeTime})</small>
        )}
      </>
    </span>
  );
};

export default DateDisplay;
