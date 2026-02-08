import { Check, X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  isEditing: boolean;
  compact?: boolean;
  disabled?: boolean;

  display: React.ReactNode;
  editor: React.ReactNode;

  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;

  className?: string;
};

export const EditableCell = ({
                               isEditing,
                               compact = true,
                               disabled,
                               display,
                               editor,
                               onStartEdit,
                               onSave,
                               onCancel,
                               className,
                             }: Props) => {
  if (!isEditing) {
    return (
      <div
        className={cn(
          'cursor-pointer rounded transition-colors',
          compact ? 'p-0' : 'p-2',
          'hover:bg-muted/50',
          disabled && 'pointer-events-none opacity-60',
          className,
        )}
        onClick={onStartEdit}
      >
        {display}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 min-w-0">{editor}</div>
      <div className="shrink-0 flex items-center">
        <Button disabled={disabled} size="icon" variant="ghost" className="h-8 w-8 p-0" onClick={onSave}>
          <Check className="h-4 w-4" />
        </Button>
        <Button disabled={disabled} size="icon" variant="ghost" className="h-8 w-8 p-0" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EditableCell;
