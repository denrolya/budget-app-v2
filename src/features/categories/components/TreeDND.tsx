import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import Category from '@/features/categories/models/Category';
import { cn } from '@/lib/utils';

import { useMutations } from '../api';
import { CategoryType } from '../types';

import TreeNode from './TreeNode';

const isDescendant = (node: Category, targetId: number): boolean =>
  node.children.some((child) => child.id === targetId || isDescendant(child, targetId));

const wouldCreateCircle = (category: Category, newParent: number | null): boolean =>
  newParent !== null && (newParent === category.id || isDescendant(category, newParent));

const sortRoot = (items: Category[]) =>
  [...items].sort((a, b) => {
    const aFolder = a.children.length > 0;
    const bFolder = b.children.length > 0;
    if (aFolder !== bFolder) return aFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

type OpenStateById = Record<number, boolean>;

const buildDefaultOpenState = (roots: Category[], defaultCollapsed: boolean): OpenStateById => {
  if (defaultCollapsed) return {};
  const state: OpenStateById = {};
  for (const root of roots) state[root.id] = true;
  return state;
};

const collectAllIds = (roots: Category[]): number[] => {
  const ids: number[] = [];
  const walk = (node: Category) => {
    ids.push(node.id);
    for (const child of node.children) walk(child);
  };
  for (const r of roots) walk(r);
  return ids;
};

export interface CategoryTreeRef {
  expandAll: () => void;
  collapseAll: () => void;
  setOpen: (id: number, open: boolean) => void;
  toggle: (id: number) => void;
}

interface Props {
  categories: Category[];
  type: CategoryType;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddNew: (parent: number | null, type: CategoryType) => void;

  openById?: OpenStateById;
  onOpenByIdChange?: (next: OpenStateById) => void;
  defaultCollapsed?: boolean;
}

const CategoryTree = forwardRef<CategoryTreeRef, Props>(
  ({ categories, type, onEdit, onDelete, onAddNew, openById, onOpenByIdChange, defaultCollapsed = true }, ref) => {
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
    const [dropTargetId, setDropTargetId] = useState<number | null>(null);
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

    const { moveWithBreadcrumb, isMoving } = useMutations();

    const sortedRoot = useMemo(() => sortRoot(categories), [categories]);

    const isControlled = openById != null;

    const [uncontrolledOpenById, setUncontrolledOpenById] = useState<OpenStateById>(() =>
      buildDefaultOpenState(sortedRoot, defaultCollapsed),
    );

    const effectiveOpenById = isControlled ? (openById ?? {}) : uncontrolledOpenById;

    const setOpenById = (updater: (prev: OpenStateById) => OpenStateById) => {
      if (isControlled) {
        const next = updater(openById ?? {});
        onOpenByIdChange?.(next);
        return;
      }
      setUncontrolledOpenById((prev) => updater(prev));
    };

    const setNodeOpen = (id: number, open: boolean) => {
      setOpenById((prev) => ({ ...prev, [id]: open }));
    };

    const toggleNodeOpen = (id: number) => {
      setOpenById((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // If roots list changes (or defaultCollapsed changes) — reset uncontrolled default state.
    useEffect(() => {
      if (isControlled) return;
      setUncontrolledOpenById(buildDefaultOpenState(sortedRoot, defaultCollapsed));
    }, [isControlled, sortedRoot, defaultCollapsed]);

    useImperativeHandle(
      ref,
      () => ({
        expandAll: () => {
          const ids = collectAllIds(sortedRoot);
          setOpenById(() => ids.reduce<OpenStateById>((acc, id) => ({ ...acc, [id]: true }), {}));
        },
        collapseAll: () => {
          setOpenById(() => buildDefaultOpenState(sortedRoot, true));
        },
        setOpen: (id: number, open: boolean) => setNodeOpen(id, open),
        toggle: (id: number) => toggleNodeOpen(id),
      }),
      [sortedRoot],
    );

    const startDrag = (e: React.DragEvent, cat: Category) => {
      setDraggedId(cat.id);
      setDraggedCategory(cat);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(cat.id));

      const clone = e.currentTarget.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-1000px';
      clone.style.opacity = '0.8';
      clone.style.transform = 'scale(0.95)';
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, 20, 20);
      setTimeout(() => clone.remove(), 0);
    };

    const endDrag = () => {
      setDraggedId(null);
      setDraggedCategory(null);
      setDropTargetId(null);
      setDropPosition(null);
    };

    const dragOver = (e: React.DragEvent, cat: Category) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedCategory || draggedId === cat.id || wouldCreateCircle(draggedCategory, cat.id)) {
        setDropTargetId(null);
        setDropPosition(null);
        return;
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;

      setDropTargetId(cat.id);
      if (y < rect.height * 0.25) setDropPosition('before');
      else if (y > rect.height * 0.75) setDropPosition('after');
      else setDropPosition('inside');
    };

    const dragLeave = (e: React.DragEvent) => {
      const next = e.relatedTarget as HTMLElement | null;
      if (!next || !e.currentTarget.contains(next)) {
        setDropTargetId(null);
        setDropPosition(null);
      }
    };

    const drop = async (e: React.DragEvent, target: Category) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedCategory || draggedId === target.id) return endDrag();

      if (dropPosition === 'inside' && wouldCreateCircle(draggedCategory, target.id)) {
        return endDrag();
      }

      const parent = dropPosition === 'inside' ? target : (target.parent ?? null);
      const newParent = parent ? parent.id : null;
      const breadcrumb = parent ? parent.getFullPath() : [];

      await moveWithBreadcrumb({ id: draggedId!, type, newParent }, breadcrumb);
      endDrag();
    };

    const addChild = (parent: Category | null) => {
      onAddNew(parent ? parent.id : null, type);
      if (parent) setNodeOpen(parent.id, true);
    };

    return (
      <div
        aria-label={`${type} categories`}
        role="tree"
        className={cn('space-y-1', {
          'opacity-60 pointer-events-none': isMoving,
        })}
      >
        <div className="min-h-16">
          {sortedRoot.length === 0 && (
            <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-border text-2xs text-muted-foreground">
              No categories yet
            </div>
          )}

          {sortedRoot.length > 0 && (
            <div className="space-y-px">
              {sortedRoot.map((cat) => (
                <TreeNode
                  category={cat}
                  depth={0}
                  draggedId={draggedId}
                  dropPosition={dropPosition}
                  dropTargetId={dropTargetId}
                  isOpen={Boolean(effectiveOpenById[cat.id])}
                  openById={effectiveOpenById}
                  setOpenById={(id, open) => setNodeOpen(id, open)}
                  toggleOpenById={(id) => toggleNodeOpen(id)}
                  key={cat.id}
                  onAddChild={(c) => addChild(c)}
                  onDelete={onDelete}
                  onDragEnd={endDrag}
                  onDragLeave={dragLeave}
                  onDragOver={dragOver}
                  onDragStart={startDrag}
                  onDrop={drop}
                  onEdit={onEdit}
                  onOpenChange={(open) => setNodeOpen(cat.id, open)}
                  onToggle={() => toggleNodeOpen(cat.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

CategoryTree.displayName = 'CategoryTree';
export default CategoryTree;
