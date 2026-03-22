export const BUDGET_NIVO_THEME = {
  background: 'transparent',
  text: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 },
  grid: { line: { stroke: 'hsl(var(--border))', strokeWidth: 1 } },
  axis: {
    ticks: {
      line: { stroke: 'transparent' },
      text: { fill: 'hsl(var(--muted-foreground))', fontSize: 10 },
    },
    domain: { line: { stroke: 'transparent' } },
  },
} as const;
