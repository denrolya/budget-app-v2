import { Folder, FolderOpen, FolderPlus, GripVertical, Pencil, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';

import Category from '../models/Category';

type DropPosition = 'before' | 'after' | 'inside' | null;

interface Props {
  category: Category;
  depth: number;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddChild: (c: Category) => void;
  draggedId: number | null;
  dropTargetId: number | null;
  dropPosition: DropPosition;
  onDragStart: (e: React.DragEvent, c: Category) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, c: Category) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, c: Category) => void;
}

const LEVEL_PX = 18;
const ROW_H = 22;
const ICON_COL_W = 20;
const ICON_CENTER = ICON_COL_W / 2;
const RAIL_OFFSET = 10;

const sortChildren = (children: Category[]) =>
  [...children].sort((a, b) => {
    const aFolder = a.children.length > 0;
    const bFolder = b.children.length > 0;
    if (aFolder !== bFolder) return aFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

const TreeNode: React.FC<Props> = ({
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
                                   }) => {
  const [open, setOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const hasChildren = category.children.length > 0;
  const isDragging = draggedId === category.id;
  const isDropTarget = dropTargetId === category.id;

  const indentWidth = depth * LEVEL_PX;
  const railX = depth > 0 ? (depth - 1) * LEVEL_PX + RAIL_OFFSET : null;
  const elbowY = Math.floor(ROW_H / 2);
  const elbowEndX = depth * LEVEL_PX + ICON_CENTER;
  const elbowW = railX === null ? 0 : Math.max(0, elbowEndX - railX);

  const showBefore = isDropTarget && dropPosition === 'before';
  const showAfter = isDropTarget && dropPosition === 'after' && !hasChildren;
  const showInside = isDropTarget && dropPosition === 'inside';

  const showOpenFolder = hasChildren && open;
  const showClosedFolder = hasChildren && !open;
  const showLeafDot = !hasChildren;

  const childrenSorted = useMemo(() => sortChildren(category.children), [category.children]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const toggleOpen = () => {
    if (!hasChildren) return;
    setOpen((v) => !v);
  };

  const rowClassName = cn(
    'group relative w-full flex items-center rounded px-1.5 pr-1 transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    {
      'opacity-40': isDragging,
      'cursor-pointer': hasChildren,
      'cursor-default': !hasChildren,
      'hover:bg-accent/50': !menuOpen,
      'bg-accent/50': menuOpen,
      'bg-primary/10 ring-1 ring-primary/40': showInside,
    },
  );

  const dragHandleClassName = cn(
    'absolute left-1 top-1/2 -translate-y-1/2 flex cursor-grab items-center text-muted-foreground/50 active:cursor-grabbing transition-opacity',
    {
      'opacity-100': menuOpen,
      'opacity-0': !menuOpen,
      'group-hover:opacity-100 group-focus-visible:opacity-100': !menuOpen,
    },
  );

  const overlayVisibleClassName = cn('', {
    'opacity-100': menuOpen,
    'opacity-0': !menuOpen,
    'group-hover:opacity-100 group-focus-visible:opacity-100': !menuOpen,
  });

  const actionsWrapClassName = cn(
    'absolute right-1 top-1/2 -translate-y-1/2 z-20 flex items-center gap-0.5 transition-opacity',
    overlayVisibleClassName,
  );

  const actionsScrimClassName = cn(
    'absolute right-0 top-0 bottom-0 z-10 w-24 pointer-events-none transition-opacity',
    'bg-gradient-to-l from-background via-background/80 to-transparent',
    overlayVisibleClassName,
  );

  const flagsClassName = cn(
    'absolute right-[78px] top-1/2 -translate-y-1/2 z-20 flex items-center gap-0.5 transition-opacity',
    overlayVisibleClassName,
  );

  const nameClassName = cn('min-w-0 flex-1 truncate text-[13px] leading-tight', {
    'font-medium text-foreground': hasChildren,
    'text-foreground/90': !hasChildren,
  });

  return (
    <div className="select-none">
      <Collapsible open={open} onOpenChange={setOpen}>
        <ContextMenu onOpenChange={setMenuOpen}>
          <ContextMenuTrigger asChild>
            <div className="relative">
              {showBefore && (
                <div
                  style={{ top: 0, marginLeft: indentWidth }}
                  className="absolute left-0 right-2 h-0.5 bg-primary rounded-full z-30 pointer-events-none"
                >
                  <div className="absolute -left-1 -top-[3px] size-2 rounded-full bg-primary" />
                </div>
              )}

              {showAfter && (
                <div
                  style={{ bottom: 0, marginLeft: indentWidth }}
                  className="absolute left-0 right-2 h-0.5 bg-primary rounded-full z-30 pointer-events-none"
                >
                  <div className="absolute -left-1 -top-[3px] size-2 rounded-full bg-primary" />
                </div>
              )}

              <div
                draggable
                role="treeitem"
                style={{ minHeight: ROW_H }}
                tabIndex={0}
                className={rowClassName}
                onClick={toggleOpen}
                onDragEnd={onDragEnd}
                onDragLeave={onDragLeave}
                onDragOver={(e) => onDragOver(e, category)}
                onDragStart={(e) => onDragStart(e, category)}
                onDrop={(e) => onDrop(e, category)}
              >
                <div aria-hidden="true" className={dragHandleClassName} onClick={stop}>
                  <GripVertical className="size-3.5" />
                </div>

                <div style={{ width: indentWidth }} className="relative shrink-0">
                  {railX !== null && (
                    <>
                      <div style={{ left: railX }} className="absolute top-0 bottom-0 w-px bg-border" />
                      <div style={{ left: railX, top: elbowY, width: elbowW }} className="absolute h-px bg-border" />
                    </>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <span aria-hidden="true" className="w-5" />

                  <span aria-hidden="true" className="flex size-5 items-center justify-center">
                    {showOpenFolder && <FolderOpen className="size-4 text-primary/80" />}
                    {showClosedFolder && <Folder className="size-4 text-muted-foreground" />}
                    {showLeafDot && <span className="size-1.5 rounded-full bg-muted-foreground/40" />}
                  </span>

                  <span className={nameClassName}>{category.name}</span>
                </div>

                <div aria-hidden="true" className={actionsScrimClassName} />

                {!category.isAffectingProfit && (
                  <div className={flagsClassName}>
                    <span className="size-1.5 rounded-full bg-orange-400" />
                  </div>
                )}

                <div aria-label="Category actions" role="group" className={actionsWrapClassName} onClick={stop}>
                  <Button
                    aria-label="Add subcategory"
                    size="sm"
                    variant="ghost"
                    className="size-6 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    onClick={() => onAddChild(category)}
                  >
                    <FolderPlus className="size-3" />
                  </Button>

                  <Button
                    aria-label="Edit category"
                    size="sm"
                    variant="ghost"
                    className="size-6 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    onClick={() => onEdit(category)}
                  >
                    <Pencil className="size-3" />
                  </Button>

                  <Button
                    aria-label="Delete category"
                    size="sm"
                    variant="ghost"
                    className="size-6 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(category)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent className="w-52">
            <ContextMenuItem asChild>
              <Link to={`/ledger?category=${encodeURIComponent(category.id)}`} className="flex w-full items-center">
                Show transactions
              </Link>
            </ContextMenuItem>

            <ContextMenuSeparator />

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
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {hasChildren && open && (
          <CollapsibleContent>
            <div className="relative">
              <div
                aria-hidden="true"
                style={{ left: depth * LEVEL_PX + RAIL_OFFSET }}
                className="absolute top-0 bottom-1 w-px bg-border"
              />
              {childrenSorted.map((child) => (
                <TreeNode
                  category={child}
                  depth={depth + 1}
                  draggedId={draggedId}
                  dropPosition={dropPosition}
                  dropTargetId={dropTargetId}
                  key={child.id}
                  onAddChild={onAddChild}
                  onDelete={onDelete}
                  onDragEnd={onDragEnd}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDragStart={onDragStart}
                  onDrop={onDrop}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};

export default TreeNode;
