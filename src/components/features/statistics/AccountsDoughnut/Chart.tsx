import { PieSvgProps, ResponsivePie } from '@nivo/pie';
import React, { useCallback, useMemo } from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';

type Datum = { id: string | number; label: string; value: number };

interface PieChartProps {
  data: Datum[];
  total: number;
  colorScheme?: PieSvgProps<Datum>['colors'];
  onSliceClick?: (id: string | number) => void;
  animate?: boolean;
}

const PieChart: React.FC<PieChartProps> = ({
                                             data,
                                             total,
                                             colorScheme,
                                             onSliceClick,
                                             animate = true,
                                           }) => {
  // Stable literals
  const margin = useMemo(() => ({ top: 10, right: 10, bottom: 10, left: 10 }), []);
  const borderColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 0.2] as const] }), []);
  const valueFormat = useCallback((v: number) => v.toString(), []);
  const handleClick = useCallback(
    (node: { data: { id: string | number } }) => onSliceClick?.(node.data.id),
    [onSliceClick],
  );

  // Tooltip factory that only depends on total
  const tooltip = useCallback(
    ({ datum: { data, value } }: { datum: { data: Datum; value: number } }) => (
      <div className="bg-popover text-popover-foreground p-2 rounded shadow-md">
        <strong>{data.label}</strong>
        <div>
          <MoneyValue useColors={false} amount={value} />
          <span className="ml-1 text-xs text-muted-foreground">
            {total > 0 ? ((value / total) * 100).toFixed(0) : 0}%
          </span>
        </div>
      </div>
    ),
    [total],
  );

  const colors = useMemo(() => colorScheme ?? { scheme: 'nivo' as const }, [colorScheme]);

  return (
    <ResponsivePie
      data={data}
      identity="id"
      sortByValue
      margin={margin}
      innerRadius={0.6}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      valueFormat={valueFormat}
      colors={colors}
      borderWidth={1}
      borderColor={borderColor}
      enableArcLinkLabels={false}
      enableArcLabels={false}
      tooltip={tooltip}
      onClick={handleClick}
      animate={animate}
    />
  );
};

export default React.memo(PieChart);
