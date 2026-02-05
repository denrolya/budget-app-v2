import { Plus } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import type Category from '@/features/categories/models/Category';
import { cn } from '@/lib/utils';

import { useMutations } from '../api';
import type { CategoryType } from '../types';

import TreeNode from './TreeNode';


// Check if moving would create circular reference
const wouldCreateCircle = (category: Category, newParentId: number | null): boolean => {
  if (newParentId === null) return false;
  if (category.id === newParentId) return true;

  const isDescendant = (node: Category, targetId: number): boolean => {
    for (const child of node.children) {
      if (child.id === targetId) return true;
      if (isDescendant(child, targetId)) return true;
    }
    return false;
  };

  return isDescendant(category, newParentId);
};

interface CategoryTreeProps {
  categories: Category[];
  type: CategoryType;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddNew: (parentId: number | null, type: CategoryType) => void;
}

export const CategoryTree = ({
                               categories,
                               type,
                               onEdit,
                               onDelete,
                               onAddNew,
                             }: CategoryTreeProps) => {
  const [draggedId, setDraggedId] = React.useState<number | null>(null);
  const [draggedCategory, setDraggedCategory] = React.useState<Category | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<number | null>(null);
  const [dropPosition, setDropPosition] = React.useState<'before' | 'after' | 'inside' | null>(null);

  const { moveWithBreadcrumb, isMoving } = useMutations();

  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedId(category.id);
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(category.id));

    // Create a custom drag image
    const dragEl = e.currentTarget.cloneNode(true) as HTMLElement;
    dragEl.style.position = 'absolute';
    dragEl.style.top = '-1000px';
    dragEl.style.opacity = '0.8';
    dragEl.style.transform = 'scale(0.95)';
    document.body.appendChild(dragEl);
    e.dataTransfer.setDragImage(dragEl, 20, 20);
    setTimeout(() => document.body.removeChild(dragEl), 0);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDraggedCategory(null);
    setDropTargetId(null);
    setDropPosition(null);
  };

  const handleDragOver = (e: React.DragEvent, category: Category) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || !draggedCategory || draggedId === category.id) {
      setDropTargetId(null);
      setDropPosition(null);
      return;
    }

    // Check for circular reference
    if (wouldCreateCircle(draggedCategory, category.id)) {
      e.dataTransfer.dropEffect = 'none';
      setDropTargetId(null);
      setDropPosition(null);
      return;
    }

    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // Determine drop position based on mouse location
    if (y < height * 0.25) {
      setDropPosition('before');
    } else if (y > height * 0.75) {
      setDropPosition('after');
    } else {
      setDropPosition('inside');
    }

    setDropTargetId(category.id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the tree entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || !draggedCategory || draggedId === targetCategory.id) {
      handleDragEnd();
      return;
    }

    // Check for circular reference
    if (dropPosition === 'inside' && wouldCreateCircle(draggedCategory, targetCategory.id)) {
      handleDragEnd();
      return;
    }

    let newParentId: number | null;
    let newParent: Category | null;

    if (dropPosition === 'inside') {
      newParentId = targetCategory.id;
      newParent = targetCategory;
    } else {
      newParentId = targetCategory.parent?.id ?? null;
      newParent = targetCategory.parent;
    }

    // Get breadcrumb path for the new location
    const breadcrumbPath = newParent ? newParent.getFullPath() : [];

    await moveWithBreadcrumb(
      { id: draggedId, newParentId },
      breadcrumbPath,
    );

    handleDragEnd();
  };

  const handleAddChild = (parent: Category) => {
    onAddNew(parent.id, type);
  };

  const isExpense = type === 'expense';

  return (
    <div
      aria-label={`${type} categories`}
      role="tree"
      className={cn('space-y-1', isMoving && 'opacity-60 pointer-events-none')}
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <h3
          className={cn(
            'text-2xs font-semibold uppercase tracking-wider',
            isExpense ? 'text-destructive' : 'text-success',
          )}
        >
          {isExpense ? 'Expenses' : 'Income'}
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 gap-1 px-2 text-2xs hover:bg-accent"
          onClick={() => onAddNew(null, type)}
        >
          <Plus className="size-3" />
          <span>Add</span>
        </Button>
      </div>

      <div className="min-h-16">
        {categories.length === 0 ? (
          <div
            role="status"
            className="flex h-16 items-center justify-center rounded-md border border-dashed border-border text-2xs text-muted-foreground"
          >
            No categories yet
          </div>
        ) : (
          <div className="space-y-px">
            {categories.map((category) => (
              <TreeNode
                category={category}
                depth={0}
                draggedId={draggedId}
                dropPosition={dropPosition}
                dropTargetId={dropTargetId}
                key={category.id}
                onAddChild={handleAddChild}
                onDelete={onDelete}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
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
