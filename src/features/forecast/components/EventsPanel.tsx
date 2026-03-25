import moment from 'moment';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { cn } from '@/lib/utils';

import type { ScenarioEvent } from '../models/types';
import { EVENT_PRESETS, type EventPreset } from '../hooks/useEvents';

interface Props {
  events: ScenarioEvent[];
  onAdd: (event: Omit<ScenarioEvent, 'id' | 'isActive'>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}

const TYPE_COLORS: Record<ScenarioEvent['type'], string> = {
  income: 'text-success bg-success/10 border-success/30',
  expense: 'text-destructive bg-destructive/10 border-destructive/30',
  investment: 'text-primary bg-primary/10 border-primary/30',
  withdrawal: 'text-warning bg-warning/10 border-warning/30',
};

const TYPE_LABELS: Record<ScenarioEvent['type'], string> = {
  income: 'Inc',
  expense: 'Exp',
  investment: 'Inv',
  withdrawal: 'Wdl',
};

const TYPE_TIPS: Record<ScenarioEvent['type'], string> = {
  income: 'One-time or recurring income (salary raise, bonus, side gig)',
  expense: 'One-time expense (large purchase, move, medical)',
  investment: 'Lump sum added to your investment portfolio',
  withdrawal: 'Withdrawal from investments to cash',
};

const EventsPanel: React.FC<Props> = ({ events, onAdd, onRemove, onToggle }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({
    label: '',
    month: moment().add(1, 'month').format('YYYY-MM'),
    amount: 0,
    type: 'income' as ScenarioEvent['type'],
    recurring: false,
    investPercent: undefined as number | undefined,
  });

  const isIncomeType = draft.type === 'income' || draft.type === 'investment';

  const applyPreset = (preset: EventPreset) => {
    setDraft({
      label: preset.label,
      month: moment().add(1, 'month').format('YYYY-MM'),
      amount: preset.amount,
      type: preset.type,
      recurring: preset.recurring ?? false,
      investPercent: preset.investPercent,
    });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!draft.label || draft.amount === 0) return;
    onAdd({
      label: draft.label,
      month: `${draft.month}-01`,
      amount: draft.amount,
      type: draft.type,
      recurring: draft.recurring,
      investPercent: isIncomeType ? draft.investPercent : undefined,
    });
    setDraft({
      label: '',
      month: moment().add(1, 'month').format('YYYY-MM'),
      amount: 0,
      type: 'income',
      recurring: false,
      investPercent: undefined,
    });
    setIsAdding(false);
  };

  const types: ScenarioEvent['type'][] = ['income', 'expense', 'investment', 'withdrawal'];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">Events</h3>
        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Presets */}
      {isAdding && (
        <div className="space-y-2 p-2 border rounded bg-muted/30">
          <div className="flex flex-wrap gap-1">
            {EVENT_PRESETS.map((p) => (
              <button
                type="button"
                className="text-3xs font-mono px-1.5 py-0.5 rounded border border-border/60 hover:bg-muted transition-colors"
                key={p.label}
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Input
              placeholder="Event name"
              value={draft.label}
              className="h-7 text-xs"
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />

            <div className="flex gap-1.5">
              <div className="flex-1">
                <Label className="text-3xs uppercase tracking-wider text-muted-foreground">Month</Label>
                <Input
                  type="month"
                  value={draft.month}
                  className="h-7 text-xs font-mono"
                  onChange={(e) => setDraft({ ...draft, month: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <Label className="text-3xs uppercase tracking-wider text-muted-foreground">Amount</Label>
                <Input
                  step={100}
                  type="number"
                  value={draft.amount}
                  className="h-7 text-xs font-mono tabular-nums"
                  onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-0.5 bg-muted rounded p-0.5">
              {types.map((t) => (
                <button
                  type="button"
                  className={cn(
                    'flex-1 h-5 text-3xs font-medium rounded-sm transition-colors',
                    draft.type === t
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  key={t}
                  onClick={() => setDraft({ ...draft, type: t })}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  checked={draft.recurring}
                  type="checkbox"
                  className="h-3 w-3 rounded border-border"
                  onChange={(e) => setDraft({ ...draft, recurring: e.target.checked })}
                />
                <ResponsiveTooltip
                  content={
                    <span className="text-xs text-primary-foreground">
                      Applies every month from the start date onward (e.g. salary raise = +500/mo permanently)
                    </span>
                  }
                  contentClassName="p-2 max-w-[240px]"
                >
                  <span className="text-3xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/30">
                    Recurring
                  </span>
                </ResponsiveTooltip>
              </label>

              {isIncomeType && (
                <div className="flex items-center gap-1">
                  <ResponsiveTooltip
                    content={
                      <span className="text-xs text-primary-foreground">
                        % of this amount that goes directly to investments. Leave empty to use your global savings rate.
                      </span>
                    }
                    contentClassName="p-2 max-w-[220px]"
                  >
                    <span className="text-3xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/30">
                      →invest
                    </span>
                  </ResponsiveTooltip>
                  <Input
                    max={100}
                    min={0}
                    placeholder="—"
                    step={5}
                    type="number"
                    value={draft.investPercent ?? ''}
                    className="h-5 w-12 text-3xs font-mono tabular-nums px-1"
                    onChange={(e) =>
                      setDraft({ ...draft, investPercent: e.target.value === '' ? undefined : Number(e.target.value) })
                    }
                  />
                  <span className="text-3xs text-muted-foreground">%</span>
                </div>
              )}
            </div>

            <Button
              disabled={!draft.label || draft.amount === 0}
              size="sm"
              className="w-full h-7 text-2xs"
              onClick={handleSave}
            >
              Add Event
            </Button>
          </div>
        </div>
      )}

      {/* Event list */}
      {events.length === 0 && !isAdding && (
        <p className="text-3xs text-muted-foreground/50 font-mono">No events planned</p>
      )}

      <div className="space-y-0.5">
        {events.map((event) => {
          const monthLabel = moment(event.month).format("MMM 'YY");
          return (
            <div
              className={cn('flex items-center gap-1.5 px-1.5 py-1 rounded text-xs group', {
                'opacity-40': !event.isActive,
              })}
              key={event.id}
            >
              <ResponsiveTooltip
                content={<span className="text-xs text-primary-foreground">{TYPE_TIPS[event.type]}</span>}
                contentClassName="p-2 max-w-[200px]"
              >
                <span
                  className={cn('text-3xs font-mono px-1 py-0.5 rounded border cursor-help', TYPE_COLORS[event.type])}
                >
                  {TYPE_LABELS[event.type]}
                </span>
              </ResponsiveTooltip>
              <div className="flex-1 min-w-0">
                <div className="text-2xs font-medium truncate">{event.label}</div>
                <div className="text-3xs font-mono text-muted-foreground tabular-nums">
                  {monthLabel}
                  {event.recurring ? '→' : ''} · {event.amount >= 0 ? '+' : ''}
                  {event.amount.toLocaleString()}
                  {event.recurring ? '/mo' : ''}
                  {event.investPercent != null ? ` · ${event.investPercent}%→inv` : ''}
                </div>
              </div>
              <button
                type="button"
                className="h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                onClick={() => onToggle(event.id)}
              >
                {event.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
              <button
                type="button"
                className="h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(event.id)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventsPanel;
