import React from 'react';
import { ChevronRight, GripVertical, Pencil, Trash2, FolderPlus, Folder, FolderOpen } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { Category } from '@/lib/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface TreeNodeProps {
  category: Category
  depth: number
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onAddChild: (parent: Category) => void
  draggedId: string | null
  dropTargetId: string | null
  dropPosition: 'before' | 'after' | 'inside' | null
  onDragStart: (e: React.DragEvent, category: Category) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, category: Category) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, category: Category) => void
}

export const TreeNode = ({
                           category,
                           depth,
                           onEdit,
                           onDelete,
                           onAddChild,
                           draggedId,
                           dropTargetId,
                           dropPosition,
                           onDragStart,
                           onDragEnd,
                           onDragOver,
                           onDragLeave,
                           onDrop,
                         }: TreeNodeProps) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const hasChildren = category.children.length > 0;
  const isDragging = draggedId === category.id;
  const isDropTarget = dropTargetId === category.id;

  // Compact indentation for deep trees - use spacing scale
  const indent = Math.min(depth * 4, 24); // in tailwind spacing units (16, 32, 48... max 96px)

  return (
    <div className={cn('select-none', isDragging && 'opacity-40')}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="relative">
              {/* Drop indicator BEFORE */}
              {isDropTarget && dropPosition === 'before' && (
                <div
                  style={{ top: 0, marginLeft: `${indent * 4}px` }}
                  className="absolute left-0 right-2 h-0.5 bg-primary rounded-full z-20 pointer-events-none"
                >
                  <div className="absolute -left-1 -top-[3px] size-2 rounded-full bg-primary" />
                </div>
              )}

              {/* Drop indicator AFTER */}
              {isDropTarget && dropPosition === 'after' && !hasChildren && (
                <div
                  style={{ bottom: 0, marginLeft: `${indent * 4}px` }}
                  className="absolute left-0 right-2 h-0.5 bg-primary rounded-full z-20 pointer-events-none"
                >
                  <div className="absolute -left-1 -top-[3px] size-2 rounded-full bg-primary" />
                </div>
              )}

              <div
                draggable
                aria-expanded={hasChildren ? isOpen : undefined}
                aria-selected={false}
                role="treeitem"
                style={{ paddingLeft: `${indent * 4 + 4}px` }}
                tabIndex={0}
                className={cn(
                  'group relative flex items-center gap-1 rounded-md py-1 pr-1 transition-colors',
                  'hover:bg-accent',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                  isDropTarget && dropPosition === 'inside' && 'bg-primary/10 ring-1 ring-primary/40'
                )}
                onDragEnd={onDragEnd}
                onDragLeave={onDragLeave}
                onDragOver={(e) => onDragOver(e, category)}
                onDragStart={(e) => onDragStart(e, category)}
                onDrop={(e) => onDrop(e, category)}
              >
                {/* Drag handle */}
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex cursor-grab items-center text-muted-foreground/50 transition-opacity active:cursor-grabbing',
                    'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                  )}
                >
                  <GripVertical className="size-3.5" />
                </div>

                {/* Expand/collapse */}
                {hasChildren ? (
                  <CollapsibleTrigger asChild>
                    <Button
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                      size="sm"
                      variant="ghost"
                      className="size-5 p-0 hover:bg-secondary"
                    >
                      <ChevronRight
                        className={cn(
                          'size-3.5 text-muted-foreground transition-transform duration-150',
                          isOpen && 'rotate-90'
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                ) : (
                  <div aria-hidden="true" className="w-5" />
                )}

                {/* Folder icon */}
                <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                  {hasChildren && isOpen ? (
                    <FolderOpen className="size-3.5" />
                  ) : (
                    <Folder className="size-3.5" />
                  )}
                </div>

                {/* Name */}
                <span className="flex-1 truncate text-sm leading-tight text-foreground">
                  {category.name}
                </span>

                {/* Compact badges */}
                <div aria-label="Category flags" role="group" className="flex items-center gap-0.5 mr-0.5">
                  {category.isAffectingGlobalProfit && (
                    <span
                      aria-label="Affects Global Profit"
                      role="img"
                      title="Affects Global Profit"
                      className="size-1.5 rounded-full bg-success"
                    />
                  )}
                  {category.isTechnical && (
                    <span
                      aria-label="Technical"
                      role="img"
                      title="Technical"
                      className="size-1.5 rounded-full bg-info"
                    />
                  )}
                  {category.isFixed && (
                    <span
                      aria-label="Fixed"
                      role="img"
                      title="Fixed"
                      className="size-1.5 rounded-full bg-warning"
                    />
                  )}
                </div>

                {/* Actions */}
                <div
                  aria-label="Category actions"
                  role="group"
                  className={cn(
                    'flex items-center transition-opacity',
                    'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                  )}
                >
                  <Button
                    aria-label="Add subcategory"
                    size="sm"
                    variant="ghost"
                    className="size-6 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChild(category);
                    }}
                  >
                    <FolderPlus className="size-3" />
                  </Button>
                  <Button
                    aria-label="Edit category"
                    size="sm"
                    variant="ghost"
                    className="size-6 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(category);
                    }}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    aria-label="Delete category"
                    size="sm"
                    variant="ghost"
                    className="size-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(category);
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-44">
            <ContextMenuItem onClick={() => onAddChild(category)}>
              <FolderPlus className="mr-2 size-4" />
              Add Subcategory
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onEdit(category)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {hasChildren && (
          <CollapsibleContent>
            <div className="relative">
              {/* Tree line */}
              <div
                aria-hidden="true"
                style={{ left: `${indent * 4 + 22}px` }}
                className="absolute top-0 bottom-1 w-px bg-border"
              />
              {category.children.map((child, index) => (
                <React.Fragment key={child.id}>
                  <TreeNode
                    category={child}
                    depth={depth + 1}
                    draggedId={draggedId}
                    dropPosition={dropPosition}
                    dropTargetId={dropTargetId}
                    onAddChild={onAddChild}
                    onDelete={onDelete}
                    onDragEnd={onDragEnd}
                    onDragLeave={onDragLeave}
                    onDragOver={onDragOver}
                    onDragStart={onDragStart}
                    onDrop={onDrop}
                    onEdit={onEdit}
                  />
                  {/* Drop indicator AFTER last child at parent level */}
                  {isDropTarget && dropPosition === 'after' && index === category.children.length - 1 && (
                    <div
                      style={{ marginLeft: `${indent * 4}px` }}
                      className="relative h-0.5 bg-primary rounded-full z-20 pointer-events-none mx-2"
                    >
                      <div className="absolute -left-1 -top-[3px] size-2 rounded-full bg-primary" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};

export default TreeNode;
