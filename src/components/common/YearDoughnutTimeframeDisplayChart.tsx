import React from 'react';
import moment from 'moment';

type TimeframeType = {
  after: moment.Moment
  before: moment.Moment
}

interface Props {
  data: moment.Moment[] | TimeframeType[]
  colors?: string[]
}

export const YearDoughnut: React.FC<Props> = ({ data, colors = ['fill-blue-500 dark:fill-blue-400', 'fill-red-500 dark:fill-red-400'] }) =>  {
  const getSeasonColor = (season: string): string => {
    switch (season) {
      case 'Winter':
        return 'fill-gray-200 dark:fill-gray-600';
      case 'Spring':
        return 'fill-green-300 dark:fill-green-700';
      case 'Summer':
        return 'fill-orange-300 dark:fill-orange-700';
      case 'Autumn':
        return 'fill-red-400 dark:fill-red-700';
      default:
        return 'fill-white dark:fill-gray-800';
    }
  };

  const getDayOfYear = (date: moment.Moment): number => date.dayOfYear() + (date.year() - moment().year()) * 365;

  const getAngle = (day: number): number => (day % 365 / 365) * 360 + 90; // Start from the bottom (winter)

  const makeCoordinates = (angle: number, radius: number): [number, number] => {
    const angleInRadians = angle * (Math.PI / 180);
    return [150 + radius * Math.cos(angleInRadians), 150 + radius * Math.sin(angleInRadians)];
  };

  const makeSectorPath = (
    startAngle: number,
    endAngle: number,
    innerRadius: number,
    outerRadius: number
  ): string => {
    const [startX, startY] = makeCoordinates(startAngle, outerRadius);
    const [endX, endY] = makeCoordinates(endAngle, outerRadius);
    const [innerStartX, innerStartY] = makeCoordinates(startAngle, innerRadius);
    const [innerEndX, innerEndY] = makeCoordinates(endAngle, innerRadius);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      `M ${startX} ${startY}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L ${innerEndX} ${innerEndY}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
      'Z',
    ].join(' ');
  };

  const renderTimeframe = (
    after: moment.Moment,
    before: moment.Moment,
    innerRadius: number,
    outerRadius: number,
    color: string
  ) => {
    const startAngle = getAngle(getDayOfYear(after));
    const endAngle = getAngle(getDayOfYear(before));
    const path = makeSectorPath(startAngle, endAngle, innerRadius, outerRadius);
    return <path key={`${after.toISOString()}-${before.toISOString()}-${innerRadius}-${outerRadius}`} d={path} className={color} />;
  };

  const seasons = [
    { name: 'Winter', startAngle: 45, endAngle: 135 },
    { name: 'Spring', startAngle: 135, endAngle: 225 },
    { name: 'Summer', startAngle: 225, endAngle: 315 },
    { name: 'Autumn', startAngle: 315, endAngle: 45 },
  ];

  const renderData = () => {
    if (data.length === 0) return null;

    const isTimeframeArray = 'after' in data[0];

    if (isTimeframeArray) {
      return (data as TimeframeType[]).map((timeframe, index) => {
        const innerRadius = 15 + (index * 45);
        const outerRadius = innerRadius + 45;
        return renderTimeframe(
          timeframe.after,
          timeframe.before,
          innerRadius,
          outerRadius,
          colors[index % colors.length]
        );
      });
    } else {
      const sortedDates = (data as moment.Moment[]).sort((a, b) => a.valueOf() - b.valueOf());
      return sortedDates.map((date, index) => {
        const nextDate = sortedDates[index + 1] || moment(date).add(1, 'year');
        const innerRadius = 15 + (index * 45);
        const outerRadius = innerRadius + 45;
        return renderTimeframe(
          date,
          nextDate,
          innerRadius,
          outerRadius,
          colors[index % colors.length]
        );
      });
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 300"
        className="transition-colors duration-300 ease-in-out"
      >
        {seasons.map((season) => (
          <path
            key={season.name}
            d={makeSectorPath(season.startAngle, season.endAngle, 105, 150)}
            className={`${getSeasonColor(season.name)} transition-colors duration-300 ease-in-out`}
          />
        ))}
        {[...Array(12)].map((_, index) => {
          const monthAngle = (index / 12) * 360 + 90;
          const [x, y] = makeCoordinates(monthAngle, 127.5);
          return (
            <text
              key={index}
              x={x}
              y={y}
              className="text-sm fill-gray-700 dark:fill-gray-200 font-medium"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${monthAngle + 90}, ${x}, ${y})`}
            >
              {moment().month(index).format('MMM')}
            </text>
          );
        })}
        {renderData()}

        {/* New Year indicator */}
        <circle cx="150" cy="300" r="6" className="fill-yellow-400 dark:fill-yellow-300" />
      </svg>
    </div>
  );
};

export default YearDoughnut;
