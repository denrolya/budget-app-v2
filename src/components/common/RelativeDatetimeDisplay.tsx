import moment, { Moment } from 'moment';
import React, { useMemo } from 'react';

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  date: Moment;
  showTime?: boolean;
}

const RelativeDatetimeDisplay: React.FC<Props> = ({ showTime = true, date, className }) => {
  const isCurrentYear = date.year() === moment().year();

  const formattedDate = useMemo(() => {
    if (showTime) {
      return isCurrentYear ? date.format('MMM D, HH:mm') : date.format('MMM D, YYYY HH:mm');
    } else {
      return isCurrentYear ? date.format('dddd, D MMM') : date.format('dddd, D MMM, YYYY');
    }
  }, [date, isCurrentYear, showTime]);

  const relativeTime = useMemo(() => date.fromNow(), [date]);

  return (
    <span className={className}>
      <span className="font-light">{formattedDate}</span>
      {' '}
      <span className="font-medium">({relativeTime})</span>
    </span>
  );
};

export default RelativeDatetimeDisplay;
