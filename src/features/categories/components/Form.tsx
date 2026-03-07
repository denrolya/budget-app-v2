import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useForm as useFormContext } from '@/contexts/Form';
import CategoryTypeahead from '@/features/categories/components/CategoryTypeahead';
import type Category from '@/features/categories/models/Category';
import { useExpenseCategories, useIncomeCategories } from '@/hooks/financeData';
import { useFormLogic } from '@/hooks/useFormLogic';
import { Type as TransactionType } from '@/features/transactions';

import { useMutations } from '../api';
import { CategoryType, type CreateCategoryDTO, type UpdateCategoryDTO } from '../types';

const schema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).min(2, { message: 'Name must be at least 2 characters.' }),
  type: z.enum(['expense', 'income']),
  parent: z.number().int().nullable(),
  isAffectingProfit: z.boolean(),
  isFixed: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export interface CategoryFormRef {
  submitForm: () => Promise<void>;
}

interface CategoryFormProps {
  key?: string;
  category?: Category | null;
  parent?: number | null;
  type?: CategoryType;
}

export const CategoryForm = forwardRef<CategoryFormRef, CategoryFormProps>((_, ref) => {
  const { create, update, isCreating, isUpdating } = useMutations();
  const incomeCategories = useIncomeCategories() ?? [];
  const expenseCategories = useExpenseCategories() ?? [];
  const isLoading = isCreating || isUpdating;

  const {
    updateFormState,
    formState: { values: data },
  } = useFormContext();

  const defaultValues = useMemo<FormValues>(() => {
    let normalizedParent: number | null = null;

    const rawParent = data?.parent ?? null;

    if (rawParent !== null && rawParent !== undefined) {
      if (typeof rawParent === 'number') {
        normalizedParent = Number.isFinite(rawParent) ? rawParent : null;
      } else if (typeof rawParent === 'string') {
        const n = Number(rawParent.trim());
        normalizedParent = Number.isFinite(n) ? n : null;
      } else if (typeof rawParent === 'object' && 'id' in rawParent) {
        const id = (rawParent as { id?: unknown }).id;
        if (typeof id === 'number' && Number.isFinite(id)) {
          normalizedParent = id;
        } else if (typeof id === 'string') {
          const n = Number(id.trim());
          normalizedParent = Number.isFinite(n) ? n : null;
        }
      }
    }

    return {
      ...data,
      name: data?.name ?? '',
      type: data?.type ?? CategoryType.Expense,
      parent: normalizedParent,
      isAffectingProfit: data?.isAffectingProfit ?? true,
      isFixed: data?.isFixed ?? false,
    };
  }, [data]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedType = form.watch('type');
  const watchedParent = form.watch('parent');
  const watchedName = form.watch('name');

  const allCategories = watchedType === 'expense' ? expenseCategories : incomeCategories;

  useEffect(() => {
    if (watchedParent == null) return;
    const ok = allCategories.some((cat) => cat.id === watchedParent);
    if (!ok) form.setValue('parent', null, { shouldDirty: true, shouldValidate: true });
  }, [allCategories, watchedParent, form]);

  const selectedParent = useMemo(() => {
    if (!watchedParent) return null;
    return allCategories.find((cat) => cat.id === watchedParent) ?? null;
  }, [allCategories, watchedParent]);

  const breadcrumbPath = useMemo(() => selectedParent?.getFullPath() ?? [], [selectedParent]);

  const { formRef } = useFormLogic({
    form,
    setFormState: updateFormState,
    onSubmit: async (values) => {
      const name = values.name.trim();
      if (!name) return;

      try {
        if (data?.id) {
          const payload: UpdateCategoryDTO = {
            name,
            type: values.type as CategoryType,
            parent: values.parent,
            isAffectingProfit: values.isAffectingProfit,
            isFixed: values.isFixed,
          };
          await update({ id: data.id, payload });
        } else {
          const payload: CreateCategoryDTO = {
            name,
            type: values.type as CategoryType,
            parent: values.parent,
            isAffectingProfit: values.isAffectingProfit,
            isFixed: values.isFixed,
          };
          await create(payload);
        }
      } catch (error) {
        console.error('Category form submission failed:', error);
        toast.error('Failed to submit category');
      }
    },
  });

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await formRef.current?.submitForm();
    },
  }));

  return (
    <Form {...form}>
      <form aria-label="Category form" className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="w-full sm:w-[11rem]">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <ToggleGroup
                    disabled={isLoading}
                    type="single"
                    value={field.value}
                    className="inline-flex h-8 w-full gap-0 overflow-hidden rounded-md border"
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                  >
                    <ToggleGroupItem
                      aria-label="Expense"
                      value="expense"
                      className="h-8 flex-1 rounded-none border-r px-3 text-xs"
                    >
                      Expense
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      aria-label="Income"
                      value="income"
                      className="h-8 flex-1 rounded-none px-3 text-xs"
                    >
                      Income
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parent"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Category</FormLabel>
                <CategoryTypeahead
                  disabled={field.disabled}
                  multiple={false}
                  name={field.name}
                  size="sm"
                  type={form.watch('type') as TransactionType}
                  value={field.value != null ? String(field.value) : null}
                  onBlur={field.onBlur}
                  onChange={(v) => field.onChange(v ? Number(v) : null)}
                  ref={field.ref}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-2.5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    disabled={isLoading}
                    placeholder="Category name"
                    className="h-8 text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div
            aria-label="Category path preview"
            role="navigation"
            className="flex items-center gap-1 text-2xs text-muted-foreground bg-muted rounded px-2 py-1.5 min-h-7"
          >
            {breadcrumbPath.length === 0 ? (
              <span className="italic">Root</span>
            ) : (
              breadcrumbPath.map((segment, i) => (
                <span className="inline-flex items-center gap-1 min-w-0" key={i}>
                  {i > 0 && <ChevronRight aria-hidden="true" className="size-3 text-muted-foreground/50 shrink-0" />}
                  <span className="truncate">{segment}</span>
                </span>
              ))
            )}

            {watchedName.trim() && (
              <>
                <ChevronRight aria-hidden="true" className="size-3 text-muted-foreground/50 shrink-0" />
                <span className="text-foreground font-medium truncate">{watchedName.trim()}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <FormField
              control={form.control}
              name="isAffectingProfit"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      disabled={isLoading}
                      id="affecting-profit"
                      className="scale-75"
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel
                    htmlFor="affecting-profit"
                    className="cursor-pointer select-none text-3xs text-muted-foreground"
                  >
                    Profit
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFixed"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      disabled={isLoading}
                      id="fixed"
                      className="scale-75"
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel htmlFor="fixed" className="cursor-pointer select-none text-3xs text-muted-foreground">
                    Fixed
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
});

CategoryForm.displayName = 'CategoryForm';

export default CategoryForm;
