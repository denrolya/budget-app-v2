import { Minus, Plus, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { cn } from '@/lib/utils';

import type { ReferenceLine } from '../models/types';

const COLOR_OPTIONS: ReferenceLine['color'][] = ['success', 'warning', 'destructive', 'primary', 'muted'];

const COLOR_CLASSES: Record<ReferenceLine['color'], string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  primary: 'bg-primary',
  muted: 'bg-muted-foreground',
};

const PRESETS: { label: string; value: number; color: ReferenceLine['color'] }[] = [
  { label: 'Emergency 6mo', value: 21000, color: 'warning' },
  { label: '100K milestone', value: 100000, color: 'success' },
  { label: 'RE protection', value: 6080, color: 'primary' },
];

interface Props {
  lines: ReferenceLine[];
  onAdd: (line: Omit<ReferenceLine, 'id'>) => void;
  onRemove: (id: string) => void;
}

const ReferenceLinesPanel: React.FC<Props> = ({ lines, onAdd, onRemove }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [color, setColor] = useState<ReferenceLine['color']>('success');

  const handleAdd = useCallback(() => {
    const numValue = parseFloat(value.replace(/,/g, ''));
    if (!label.trim() || isNaN(numValue) || numValue <= 0) return;
    onAdd({ label: label.trim(), value: numValue, color });
    setLabel('');
    setValue('');
    setColor('success');
    setIsAdding(false);
  }, [label, value, color, onAdd]);

  const handlePreset = useCallback(
    (preset: (typeof PRESETS)[0]) => {
      onAdd({ label: preset.label, value: preset.value, color: preset.color });
    },
    [onAdd],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <ResponsiveTooltip
          content={
            <span className="text-primary-foreground">
              Horizontal lines on the net worth chart marking personal financial goals
            </span>
          }
        >
          <span className="text-2xs font-medium uppercase tracking-widest text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/30">
            Goal Lines
          </span>
        </ResponsiveTooltip>
        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>

      {/* Existing lines */}
      {lines.map((line) => (
        <div className="flex items-center gap-2 text-xs font-mono" key={line.id}>
          <span className={cn('h-2 w-2 rounded-full shrink-0', COLOR_CLASSES[line.color])} />
          <span className="truncate flex-1">{line.label}</span>
          <span className="text-muted-foreground tabular-nums">{line.value.toLocaleString()}</span>
          <button
            className="h-4 w-4 shrink-0 flex items-center justify-center text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(line.id)}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Quick presets */}
      {isAdding && (
        <div className="space-y-2 border border-border/50 rounded-md p-2">
          <div className="flex flex-wrap gap-1">
            {PRESETS.filter((p) => !lines.some((l) => l.label === p.label)).map((preset) => (
              <button
                className="text-2xs px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                key={preset.label}
                onClick={() => handlePreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <Input placeholder="Label" value={label} className="h-6 text-xs" onChange={(e) => setLabel(e.target.value)} />
          <Input
            placeholder="Amount"
            type="number"
            value={value}
            className="h-6 text-xs"
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex items-center gap-1.5">
            {COLOR_OPTIONS.map((c) => (
              <button
                className={cn('h-4 w-4 rounded-full border-2', COLOR_CLASSES[c], {
                  'border-foreground': c === color,
                  'border-transparent': c !== color,
                })}
                key={c}
                onClick={() => setColor(c)}
              />
            ))}
            <Button disabled={!label.trim() || !value} size="sm" className="h-5 ml-auto text-2xs" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      )}

      {lines.length === 0 && !isAdding && <p className="text-2xs text-muted-foreground/50">No goal lines set</p>}
    </div>
  );
};

export default ReferenceLinesPanel;
