import { ResponsiveLine, type SliceTooltipProps } from '@nivo/line';
import moment from 'moment';
import React from 'react';

const CHART_HEIGHT = 52;

/**
 * Resolve a CSS custom-property to a concrete color string.
 * Needed because SVG stop-color doesn't support var() references.
 * Uses a temporary element so the browser's CSS engine does the conversion.
 */
function resolveCssVar(varName: string): string {
  if (typeof window === 'undefined') return '#888';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return '#888';
  // Ask the browser to parse hsl(raw) and give us back an rgb() string
  const el = document.createElement('span');
  el.style.color = `hsl(${raw})`;
  document.documentElement.appendChild(el);
  const resolved = getComputedStyle(el).color; // "rgb(R, G, B)"
  el.remove();
  return resolved || '#888';
}

interface Props {
  /** Array of {x: 'YYYY-MM-DD', y: rate} points, sorted chronologically */
  data: Array<{ x: string; y: number }>;
  isLoading?: boolean;
  /** How many decimal places to show in the hover tooltip */
  maximumFractionDigits?: number;
}

const RateSparkline: React.FC<Props> = ({ data, isLoading = false, maximumFractionDigits = 2 }) => {
  if (isLoading) {
    return <div style={{ height: CHART_HEIGHT }} className="animate-pulse bg-muted/40" />;
  }

  if (data.length < 2) {
    return (
      <div
        style={{ height: CHART_HEIGHT }}
        className="flex items-center justify-center text-[10px] text-muted-foreground/40"
      >
        no history
      </div>
    );
  }

  const first = data[0].y;
  const last = data[data.length - 1].y;
  const isUp = last >= first;
  // Resolve to a real rgb() color — both line and gradient use the same value
  const lineColor = resolveCssVar(isUp ? '--success' : '--destructive');

  const SliceTooltip = ({ slice }: SliceTooltipProps) => {
    const point = slice.points[0];
    if (!point) return null;
    const value = point.data.y as number;
    return (
      <div className="bg-background border rounded px-2 py-1.5 shadow-md text-xs leading-tight">
        <p className="text-muted-foreground mb-0.5">
          {moment(point.data.x as string, 'YYYY-MM-DD').format('D MMM YYYY')}
        </p>
        <p className="font-semibold tabular-nums">
          {value.toLocaleString('en-US', {
            minimumFractionDigits: maximumFractionDigits,
            maximumFractionDigits: maximumFractionDigits,
          })}
        </p>
      </div>
    );
  };

  return (
    <div style={{ height: CHART_HEIGHT }}>
      <ResponsiveLine
        animate={false}
        // areaOpacity + no defs/fill = area automatically uses the same color as the line
        areaOpacity={0.15}
        axisBottom={null}
        axisLeft={null}
        axisRight={null}
        axisTop={null}
        colors={[lineColor]}
        curve="natural"
        data={[{ id: 'rate', data }]}
        enableArea={true}
        enableGridX={false}
        enableGridY={false}
        enablePoints={false}
        enableSlices="x"
        isInteractive={true}
        layers={['areas', 'lines', 'slices']}
        lineWidth={1.5}
        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        sliceTooltip={SliceTooltip}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
      />
    </div>
  );
};

export default RateSparkline;
