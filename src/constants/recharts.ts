/** Shared chart series colors — matches CSS var(--chart-1) through --chart-10) */
export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
  'hsl(var(--chart-9))',
  'hsl(var(--chart-10))',
];

export const CHART_STYLES = {
  container: {
    width: '100%',
    height: '100%',
    minWidth: '600px',
  },
  chart: {
    margin: { top: 0, right: 30, bottom: 0, left: -30 },
  },
  xAxis: {
    orientation: 'bottom' as const,
    domain: ['dataMin', 'dataMax'] as [string, string],
    tick: {
      fontSize: 10,
      fill: 'hsl(var(--muted-foreground) / 0.4)',
      opacity: 0.5,
    } as Record<string, unknown>,
    tickLine: false,
    axisLine: false,
  },
  yAxis: {
    tick: {
      fontSize: 11,
      fill: 'hsl(var(--primary))',
      opacity: 0.5,
    } as Record<string, unknown>,
    tickLine: false,
    axisLine: false,
    tickFormatter: (value: number) =>
      new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(value),
  },
  cartesianGrid: {
    strokeDasharray: '3 3',
    stroke: 'hsl(var(--muted-foreground) / 0.3)',
    vertical: false,
  },
  referenceLine: {
    y: 0,
    stroke: 'hsl(var(--muted-foreground))',
    strokeOpacity: 0.3,
  },
  gradients: {
    income: [
      { offset: '0%', stopColor: 'hsl(var(--success) / 0.2)' },
      { offset: '50%', stopColor: 'hsl(var(--success) / 0.6)' },
      { offset: '100%', stopColor: 'hsl(var(--success))' },
    ],
    expenses: [
      { offset: '0%', stopColor: 'hsl(var(--destructive))' },
      { offset: '50%', stopColor: 'hsl(var(--destructive) / 0.6)' },
      { offset: '100%', stopColor: 'hsl(var(--destructive) / 0.2)' },
    ],
    revenue: [
      { offset: '0%', stopColor: 'hsl(var(--primary) / 0.2)' },
      { offset: '50%', stopColor: 'hsl(var(--primary) / 0.6)' },
      { offset: '100%', stopColor: 'hsl(var(--primary))' },
    ],
  },
  colors: {
    income: 'hsl(var(--success))',
    expenses: 'hsl(var(--destructive))',
    revenue: 'hsl(var(--primary))',
  },
};
