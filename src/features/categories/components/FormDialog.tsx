import { ChevronRight, Folder } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type Category from '@/features/categories/models/Category';
import { cn } from '@/lib/utils';

import { useMutations } from '../api';
import type { CategoryType, CreateCategoryPayload, UpdateCategoryPayload } from '../types';

// Get depth level for indentation
const getIndentLevel = (category: Category): number => {
  let depth = 0;
  let current = category.parent;
  while (current) {
    depth++;
    current = current.parent;
  }
  return depth;
};

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  parentId: number | null;
  type: CategoryType;
  allCategories: Category[]; // flat list of all categories of this type
}

export const CategoryDialog = ({
                                 open,
                                 onOpenChange,
                                 category,
                                 parentId,
                                 type,
                                 allCategories,
                               }: CategoryDialogProps) => {
  const [name, setName] = React.useState('');
  const [selectedParentId, setSelectedParentId] = React.useState<number | null>(null);
  const [isAffectingProfit, setIsAffectingProfit] = React.useState(true);

  const { create, update, isCreating, isUpdating } = useMutations();
  const isLoading = isCreating || isUpdating;
  const isEditing = category !== null;

  // Get available parent options (exclude self and descendants if editing)
  const parentOptions = React.useMemo(() => {
    if (!isEditing) return allCategories;

    // Exclude self and all descendants
    const descendants = new Set<number>();
    const collectDescendants = (cat: Category) => {
      descendants.add(cat.id);
      for (const child of cat.children) {
        collectDescendants(child);
      }
    };
    collectDescendants(category);

    return allCategories.filter((c) => !descendants.has(c.id));
  }, [allCategories, isEditing, category]);

  // Get breadcrumb path for selected parent
  const breadcrumbPath = React.useMemo(() => {
    if (!selectedParentId) return [];
    const parent = allCategories.find((c) => c.id === selectedParentId);
    return parent ? parent.getFullPath() : [];
  }, [allCategories, selectedParentId]);

  // Reset form when dialog opens/closes or category changes
  React.useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setSelectedParentId(category.parent?.id ?? null);
        setIsAffectingProfit(category.isAffectingProfit);
      } else {
        setName('');
        setSelectedParentId(parentId);
        setIsAffectingProfit(true);
      }
    }
  }, [open, category, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (isEditing && category) {
      const updates: UpdateCategoryPayload = {
        name: name.trim(),
        parentId: selectedParentId,
        isAffectingProfit,
      };
      await update({ id: category.id, updates });
    } else {
      const payload: CreateCategoryPayload = {
        name: name.trim(),
        type,
        parentId: selectedParentId,
        isAffectingProfit,
      };
      await create(payload);
    }

    onOpenChange(false);
  };

  // Build indented label for parent select
  const getIndentedLabel = (cat: Category): string => {
    const depth = getIndentLevel(cat);
    return '\u2014'.repeat(depth) + (depth > 0 ? ' ' : '') + cat.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm gap-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center gap-2 text-sm">
              {isEditing ? 'Edit Category' : 'New Category'}
              <span
                className={cn(
                  'text-3xs font-normal px-1.5 py-0.5 rounded',
                  type === 'expense'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-success/10 text-success',
                )}
              >
                {type === 'expense' ? 'Expense' : 'Income'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-2.5 pb-3">
            {/* Name input */}
            <div className="grid gap-1">
              <Label htmlFor="name" className="text-2xs">
                Name
              </Label>
              <Input
                autoFocus
                disabled={isLoading}
                id="name"
                placeholder="Category name"
                value={name}
                className="h-8 text-sm"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Parent select */}
            <div className="grid gap-1">
              <Label htmlFor="parent" className="text-2xs">
                Parent
              </Label>
              <Select
                disabled={isLoading}
                value={selectedParentId ? String(selectedParentId) : 'root'}
                onValueChange={(value) =>
                  setSelectedParentId(value === 'root' ? null : Number(value))
                }
              >
                <SelectTrigger id="parent" className="h-8 text-sm">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <span className="text-muted-foreground">Root level</span>
                  </SelectItem>
                  {parentOptions.map((cat) => (
                    <SelectItem value={String(cat.id)} key={cat.id}>
                      <span className="flex items-center gap-1.5">
                        <Folder className="size-3 text-muted-foreground" />
                        <span className="truncate">{getIndentedLabel(cat)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Breadcrumb preview */}
            <div
              aria-label="Category path preview"
              role="navigation"
              className="flex items-center gap-1 text-2xs text-muted-foreground bg-muted rounded px-2 py-1.5 min-h-7"
            >
              <span className="text-3xs uppercase tracking-wide font-medium text-muted-foreground/70 mr-1">
                Path:
              </span>
              {breadcrumbPath.length === 0 ? (
                <span className="italic">Root</span>
              ) : (
                breadcrumbPath.map((segment, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <ChevronRight
                        aria-hidden="true"
                        className="size-3 text-muted-foreground/50 shrink-0"
                      />
                    )}
                    <span className="truncate">{segment}</span>
                  </React.Fragment>
                ))
              )}
              {name.trim() && (
                <>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-3 text-muted-foreground/50 shrink-0"
                  />
                  <span className="text-foreground font-medium truncate">
                    {name.trim()}
                  </span>
                </>
              )}
            </div>

            {/* Compact toggles */}
            <fieldset className="flex items-center gap-3 pt-1">
              <legend className="sr-only">Category flags</legend>
              <label
                htmlFor="affecting-profit"
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Switch
                  checked={isAffectingProfit}
                  disabled={isLoading}
                  id="affecting-profit"
                  className="scale-75"
                  onCheckedChange={setIsAffectingProfit}
                />
                <span className="text-3xs text-muted-foreground">Profit</span>
              </label>
            </fieldset>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              disabled={isLoading}
              size="sm"
              type="button"
              variant="ghost"
              className="h-7 text-2xs"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || isLoading}
              size="sm"
              type="submit"
              className="h-7 text-2xs"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
