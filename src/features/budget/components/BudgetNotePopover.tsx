import { StickyNote } from 'lucide-react';
import React, { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import type { BudgetLineDTO } from '../api/types';

interface Props {
  line: BudgetLineDTO;
  onNoteUpdate: (lineId: number, note: string | null) => void;
}

const BudgetNotePopover: React.FC<Props> = ({ line, onNoteUpdate }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(line.note ?? '');

  const save = () => {
    onNoteUpdate(line.id, draft.trim() || null);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        if (v) setDraft(line.note ?? '');
        setOpen(v);
      }}
    >
      <PopoverTrigger asChild>
        <button
          aria-label="Note"
          title={line.note ? line.note : 'Add note'}
          type="button"
          className={cn(
            'p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
            line.note ? 'opacity-100 text-primary' : 'text-muted-foreground',
          )}
        >
          <StickyNote className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" className="w-64 p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{line ? 'Edit note' : 'Add note'}</p>
        <Textarea
          autoFocus
          placeholder="Add a note for this budget line…"
          value={draft}
          className="text-xs min-h-[72px] resize-none"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={save}>
            Save
          </button>
        </div>
        {line.note && (
          <button
            type="button"
            className="text-xs text-destructive hover:underline w-full text-left"
            onClick={() => {
              onNoteUpdate(line.id, null);
              setOpen(false);
            }}
          >
            Remove note
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default BudgetNotePopover;
