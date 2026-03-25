import moment from 'moment';
import { GitCompare, Save, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { cn } from '@/lib/utils';

import type { SavedScenario, ScenarioConfig, ScenarioEvent, TimeHorizon } from '../models/types';

interface Props {
  scenarios: SavedScenario[];
  compareId: string | null;
  onSave: (name: string, horizon: TimeHorizon, overrides: Partial<ScenarioConfig>, events: ScenarioEvent[]) => void;
  onLoad: (scenario: SavedScenario) => void;
  onDelete: (id: string) => void;
  onCompare: (id: string | null) => void;
  currentHorizon: TimeHorizon;
  currentOverrides: Partial<ScenarioConfig>;
  currentEvents: ScenarioEvent[];
}

const ScenariosPanel: React.FC<Props> = ({
  scenarios,
  compareId,
  onSave,
  onLoad,
  onDelete,
  onCompare,
  currentHorizon,
  currentOverrides,
  currentEvents,
}) => {
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSave(saveName.trim(), currentHorizon, currentOverrides, currentEvents);
    setSaveName('');
    setIsSaving(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">Scenarios</h3>
        <ResponsiveTooltip content={<span className="text-xs text-primary-foreground">Save current scenario</span>}>
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsSaving(!isSaving)}>
            <Save className="h-3 w-3" />
          </Button>
        </ResponsiveTooltip>
      </div>

      {/* Save form */}
      {isSaving && (
        <div className="flex gap-1.5">
          <Input
            autoFocus
            placeholder="Scenario name"
            value={saveName}
            className="h-7 text-xs flex-1"
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button disabled={!saveName.trim()} size="sm" className="h-7 text-2xs" onClick={handleSave}>
            Save
          </Button>
        </div>
      )}

      {/* Saved scenarios list */}
      {scenarios.length === 0 && !isSaving && (
        <p className="text-3xs text-muted-foreground/50 font-mono">No saved scenarios</p>
      )}

      <div className="space-y-0.5">
        {scenarios.map((s) => {
          const isComparing = compareId === s.id;
          return (
            <div
              className={cn('flex items-center gap-1.5 px-1.5 py-1 rounded text-xs group', {
                'bg-muted/50': isComparing,
              })}
              key={s.id}
            >
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onLoad(s)}>
                <div className="text-2xs font-medium truncate">{s.name}</div>
                <div className="text-3xs font-mono text-muted-foreground">
                  {moment(s.createdAt).format("MMM D 'YY")}
                </div>
              </div>

              <ResponsiveTooltip
                content={
                  <span className="text-xs text-primary-foreground">
                    {isComparing ? 'Stop comparing' : 'Compare with current'}
                  </span>
                }
              >
                <button
                  type="button"
                  className={cn(
                    'h-5 w-5 flex items-center justify-center rounded-sm transition-colors',
                    isComparing
                      ? 'text-primary bg-primary/10'
                      : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary',
                  )}
                  onClick={() => onCompare(isComparing ? null : s.id)}
                >
                  <GitCompare className="h-3 w-3" />
                </button>
              </ResponsiveTooltip>

              <button
                type="button"
                className="h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(s.id)}
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

export default ScenariosPanel;
