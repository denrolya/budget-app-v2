import moment, { Moment } from 'moment';
import React, { useMemo } from 'react';

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  date: Moment;
}

const RelativeDatetimeDisplay: React.FC<Props> = ({ date, className }) => {
  const isCurrentYear = date.year() === moment().year();

  const formattedDate = useMemo(() => isCurrentYear
    ? date.format('MMM D, HH:mm')
    : date.format('MMM D, YYYY HH:mm'), [date, isCurrentYear]);

  const relativeTime = useMemo(() => date.fromNow(), [date]);

  return (
    <span className={className}>
      <span className="font-light">{relativeTime}</span>
      {' '}
      <span className="font-medium">({formattedDate})</span>
    </span>
  );
};

export default RelativeDatetimeDisplay;
