import React, { useMemo, useState } from 'react';

import Category from '@/features/categories/models/Category';
import { cn } from '@/lib/utils';

import { useMutations } from '../api';
import { CategoryType } from '../types';

import TreeNode from './TreeNode';

const isDescendant = (node: Category, targetId: number): boolean =>
  node.children.some((child) => child.id === targetId || isDescendant(child, targetId));

const wouldCreateCircle = (category: Category, newParentId: number | null): boolean =>
  newParentId !== null &&
  (newParentId === category.id || isDescendant(category, newParentId));

const sortRoot = (items: Category[]) =>
  [...items].sort((a, b) => {
    const aFolder = a.children.length > 0;
    const bFolder = b.children.length > 0;
    if (aFolder !== bFolder) return aFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

interface Props {
  categories: Category[];
  type: CategoryType;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddNew: (parentId: number | null, type: CategoryType) => void;
}

const CategoryTree: React.FC<Props> = ({
                                         categories,
                                         type,
                                         onEdit,
                                         onDelete,
                                         onAddNew,
                                       }) => {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  const { moveWithBreadcrumb, isMoving } = useMutations();

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

    const parent = dropPosition === 'inside' ? target : target.parent ?? null;
    const newParentId = parent ? parent.id : null;
    const breadcrumb = parent ? parent.getFullPath() : [];

    await moveWithBreadcrumb({ id: draggedId!, newParentId }, breadcrumb);

    endDrag();
  };

  const addChild = (parent: Category | null) => {
    onAddNew(parent ? parent.id : null, type);
  };

  const sortedRoot = useMemo(() => sortRoot(categories), [categories]);

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
                key={cat.id}
                onAddChild={(c) => addChild(c)}
                onDelete={onDelete}
                onDragEnd={endDrag}
                onDragLeave={dragLeave}
                onDragOver={dragOver}
                onDragStart={startDrag}
                onDrop={drop}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryTree;
