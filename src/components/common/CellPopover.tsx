import React, { useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CellPopoverProps {
  /** Content shown as the table cell's read-only value — the clickable trigger */
  trigger: React.ReactNode;
  /** Editor rendered inside the popover */
  children: React.ReactNode;
  /** Called when the popover opens — use to initialise edit state (startEdit) */
  onOpen?: () => void;
  /** Called when the user confirms the edit */
  onSave: () => void;
  /** Called when the user cancels, presses Escape, or clicks outside */
  onCancel: () => void;
  disabled?: boolean;
  /**
   * Whether pressing Enter in the popover content triggers save.
   * Set to false for typeahead/combobox editors where Enter selects a suggestion.
   * @default true
   */
  saveOnEnter?: boolean;
  /** Extra className on PopoverContent — use to set width, e.g. "w-48" */
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
}

/**
 * Generic popover-based cell editor for data tables.
 *
 * The table layout never reflows while editing — the popover floats above.
 * Shows a minimal Save / Cancel footer inside the popover.
 */
const CellPopover: React.FC<CellPopoverProps> = ({
  trigger,
  children,
  onOpen,
  onSave,
  onCancel,
  disabled = false,
  saveOnEnter = true,
  contentClassName,
  align = 'start',
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    onOpen?.();
    setOpen(true);
  }, [disabled, onOpen]);

  const handleSave = useCallback(() => {
    onSave();
    setOpen(false);
  }, [onSave]);

  const handleCancel = useCallback(() => {
    onCancel();
    setOpen(false);
  }, [onCancel]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) handleOpen();
        else handleCancel();
      }}
    >
      <PopoverTrigger asChild>
        {/*
         * -mx-2 px-2: extend into the <td>'s default px-2 so the hover
         * highlight fills the full cell width, not just the content box.
         * py-1.5: gives a comfortable vertical hit-target in compact rows.
         */}
        <button
          disabled={disabled}
          type="button"
          className={cn(
            'block w-full min-w-0 -mx-2 px-2 py-1.5 text-left',
            disabled ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-muted/50',
          )}
        >
          {trigger}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className={cn('p-2 space-y-2 z-[9999]', contentClassName)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
          }
          if (saveOnEnter && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
        }}
      >
        {children}

        <div className="flex justify-end gap-1 border-t pt-1.5">
          <Button size="sm" type="button" variant="ghost" className="h-6 text-xs px-2" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" type="button" className="h-6 text-xs px-2" onClick={handleSave}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CellPopover;
