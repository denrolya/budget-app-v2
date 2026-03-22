import React from 'react';

import type { HealthResult } from '../utils';

// ── Gauge geometry ─────────────────────────────────────────────────────────────

const CX = 40;
const CY = 41;
const R = 34;
const STROKE_W = 4;
const NEEDLE_LEN = 28;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const arcPoint = (score: number): [number, number] => {
  const a = toRad((1 - score / 100) * 180);
  return [CX + R * Math.cos(a), CY - R * Math.sin(a)];
};

// Draws a clockwise arc from s1 to s2 along the upper semicircle
const arcPath = (s1: number, s2: number): string => {
  const [x1, y1] = arcPoint(s1);
  const [x2, y2] = arcPoint(s2);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

// ── Zone config ────────────────────────────────────────────────────────────────

const ZONES = [
  { start: 0, end: 45, color: 'hsl(var(--destructive))' },
  { start: 45, end: 60, color: 'hsl(var(--warning) / 0.75)' },
  { start: 60, end: 75, color: 'hsl(var(--warning))' },
  { start: 75, end: 90, color: 'hsl(var(--success) / 0.75)' },
  { start: 90, end: 100, color: 'hsl(var(--success))' },
] as const;

const scoreToColor = (score: number): string => {
  if (score >= 90) return 'hsl(var(--success))';
  if (score >= 75) return 'hsl(var(--success) / 0.75)';
  if (score >= 60) return 'hsl(var(--warning))';
  if (score >= 45) return 'hsl(var(--warning) / 0.75)';
  return 'hsl(var(--destructive))';
};

// ── Top penalty label ──────────────────────────────────────────────────────────

const topFactor = (factors: HealthResult['factors']): string | null => {
  const { overspendPenalty, pacePenalty, incomePenalty } = factors;
  if (overspendPenalty === 0 && pacePenalty === 0 && incomePenalty === 0) return null;
  const max = Math.max(overspendPenalty, pacePenalty, incomePenalty);
  if (overspendPenalty >= max) return 'over budget';
  if (pacePenalty >= max) return 'pace ahead';
  return 'income short';
};

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  result: HealthResult;
}

const BudgetHealthGauge: React.FC<Props> = ({ result }) => {
  const { score, grade, factors } = result;
  const color = scoreToColor(score);

  const needleAngle = toRad((1 - score / 100) * 180);
  const nx = (CX + NEEDLE_LEN * Math.cos(needleAngle)).toFixed(2);
  const ny = (CY - NEEDLE_LEN * Math.sin(needleAngle)).toFixed(2);

  const factor = topFactor(factors);

  return (
    <div className="flex flex-col items-center gap-0.5 w-full">
      <svg aria-hidden="true" viewBox="0 0 80 44" className="w-full max-w-[88px]">
        {/* Track */}
        <path d={arcPath(0, 100)} fill="none" stroke="hsl(var(--muted))" strokeLinecap="butt" strokeWidth={STROKE_W} />

        {/* Colored zones */}
        {ZONES.map((z) => (
          <path
            d={arcPath(z.start, z.end)}
            fill="none"
            strokeLinecap="butt"
            strokeWidth={STROKE_W}
            style={{ stroke: z.color }}
            key={z.start}
          />
        ))}

        {/* Needle */}
        <line
          strokeLinecap="round"
          strokeWidth={1.5}
          style={{ stroke: color }}
          x1={CX}
          x2={nx}
          y1={CY}
          y2={ny}
        />

        {/* Center pivot */}
        <circle cx={CX} cy={CY} r={2.5} style={{ fill: color }} />
      </svg>

      {/* Grade + score */}
      <div className="flex items-baseline gap-1 leading-none">
        <span
          style={{ color }}
          className="font-bold text-lg tabular-nums leading-none font-mono"
        >
          {grade}
        </span>
        <span className="text-2xs text-muted-foreground tabular-nums">{score}/100</span>
      </div>

      {/* Top penalty */}
      {factor && (
        <span className="text-2xs text-muted-foreground/70 leading-tight">{factor}</span>
      )}
    </div>
  );
};

export default BudgetHealthGauge;
