import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';
import { useForm as useFormContext } from '@/contexts/Form';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import { cn } from '@/lib/utils';

import { useMutations } from '../api/mutations';
import type Transaction from '../models/Transaction';
import { Type as TransactionType } from '../types';

// ── Schema ────────────────────────────────────────────────────────────────────

const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  account: z.number().int().positive().optional(),
  amount: z.number({ invalid_type_error: 'Amount is required' }).positive(),
  category: z.number().int().positive().optional(),
  executedAt: z.string().min(1),
  note: z.string().optional(),
  isDraft: z.boolean().default(false),
});

const formSchema = z.object({ transactions: z.array(transactionSchema) });

type FormValues = z.infer<typeof formSchema>;
type TransactionRow = FormValues['transactions'][number];

const createDefaultRow = (): TransactionRow => ({
  isDraft: false,
  account: undefined,
  amount: 0,
  type: TransactionType.Expense,
  category: undefined,
  note: undefined,
  executedAt: moment().format(MOMENT_DATETIME_FORM_FORMAT),
});

const missingRequired = (t: TransactionRow) => !t.account || !t.category;

// ── Styles ────────────────────────────────────────────────────────────────────

const cell = 'py-1 px-1.5 align-top';
const inputBase = 'h-7 text-xs';
// Compact typeahead: override default h-9 py-2 px-3 with compact equivalents
const typeaheadBase = 'h-7 text-xs py-0.5 px-2';

// ── Component ─────────────────────────────────────────────────────────────────

export const BulkCreateTableForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();
  const { submitForm, closeForm } = useFormContext();
  const { bulkCreate } = useMutations();
  const prevLengthRef = useRef(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { transactions: [createDefaultRow()] },
    mode: 'onChange',
  });

  const { fields, append, replace } = useFieldArray({ control: form.control, name: 'transactions' });

  // Focus the amount input of a newly appended row
  useEffect(() => {
    if (fields.length > prevLengthRef.current) {
      document.getElementById(`txn-amount-${fields.length - 1}`)?.focus();
    }
    prevLengthRef.current = fields.length;
  }, [fields.length]);

  const addRow = useCallback(() => append(createDefaultRow()), [append]);

  const removeRow = useCallback(
    (index: number) => {
      const current = form.getValues().transactions;
      if (current.length <= 1) {
        form.reset({ transactions: [createDefaultRow()] });
        return;
      }
      replace(current.filter((_, i) => i !== index));
    },
    [form, replace],
  );

  const validateRequired = useCallback((rows: TransactionRow[]) => {
    if (!rows.some(missingRequired)) return true;
    toast.error('Fill Account and Category for every row.');
    return false;
  }, []);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!validateRequired(data.transactions)) return;
      setIsSubmitting(true);
      try {
        await bulkCreate(data.transactions.map((t) => ({ ...t })) as unknown as Transaction[]);
        toast.success(`${data.transactions.length} transaction(s) created.`);
        submitForm(data);
        closeForm();
      } catch {
        toast.error('Submit failed. Check your data and try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [bulkCreate, closeForm, submitForm, validateRequired],
  );

  useHotkeys(
    'ctrl+n',
    (e) => {
      e.preventDefault();
      addRow();
    },
    [addRow],
  );
  useHotkeys(
    'ctrl+s,cmd+s',
    (e) => {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    },
    [form, onSubmit],
  );
  useHotkeys(
    'ctrl+x',
    (e) => {
      e.preventDefault();
      removeRow(fields.length - 1);
    },
    [fields.length, removeRow],
  );

  useEffect(() => {
    addPageHotkeys('Bulk Transaction Creation', [
      { windows: 'Ctrl+N', mac: 'Ctrl+N', description: 'Add row' },
      { windows: 'Ctrl+S', mac: 'Cmd+S', description: 'Save all' },
      { windows: 'Ctrl+X', mac: 'Ctrl+X', description: 'Remove last row' },
    ]);
    return () => removePageHotkeys('Bulk Transaction Creation');
  }, [addPageHotkeys, removePageHotkeys]);

  return (
    <Form {...form}>
      <form
        aria-label="Bulk create transactions"
        className="flex flex-col flex-1 min-h-0"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {/* ── Terminal command bar ──────────────────────────────────────────── */}
        <div className="shrink-0 border-b bg-muted/30 h-10 px-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xs font-mono font-semibold uppercase tracking-widest text-foreground">
              BULK ENTRY
            </span>
            <span className="text-2xs font-mono text-muted-foreground">
              // {fields.length} {fields.length === 1 ? 'ROW' : 'ROWS'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              disabled={isSubmitting}
              size="sm"
              tabIndex={-1}
              type="button"
              variant="ghost"
              className="h-7 px-2 gap-1 text-2xs font-mono text-muted-foreground hover:text-foreground"
              onClick={addRow}
            >
              <Plus className="h-3 w-3" />
              ADD ROW
              <kbd className="ml-0.5 text-[9px] bg-muted border border-border rounded px-1 leading-4">⌃N</kbd>
            </Button>
            <Button disabled={isSubmitting} size="sm" type="submit" className="h-7 px-3 gap-1 text-2xs font-mono">
              <Save className="h-3 w-3" />
              {isSubmitting ? 'SAVING…' : 'SAVE ALL'}
              <kbd className="ml-0.5 text-[9px] opacity-60 rounded px-1 leading-4">⌘S</kbd>
            </Button>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <Table className="min-w-[860px] table-fixed">
            <colgroup>
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-[200px]" />
              <col className="w-[170px]" />
              <col />
              <col className="w-[190px]" />
              <col className="w-8" />
            </colgroup>

            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {(['#', 'AMT', 'CATEGORY', 'ACCOUNT', 'NOTE', 'DATE', ''] as const).map((h, i) => (
                  <TableHead
                    className="h-7 px-1.5 py-0 text-2xs font-mono uppercase tracking-widest text-muted-foreground/60"
                    key={`th-${i}`}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {fields.map((row, index) => {
                const isLastRow = index === fields.length - 1;
                const type = form.watch(`transactions.${index}.type`);
                const isExpense = type === TransactionType.Expense;
                const nextType = isExpense ? TransactionType.Income : TransactionType.Expense;

                return (
                  <TableRow className="even:bg-muted/15 hover:bg-muted/30 transition-colors" key={row.id}>
                    {/* ── Meta: index + type badge + draft ─────────────────── */}
                    <TableCell
                      className={cn(cell, 'border-l-2', {
                        'border-l-destructive': isExpense,
                        'border-l-success': !isExpense,
                      })}
                    >
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="w-5 shrink-0 text-2xs font-mono text-muted-foreground/50">
                          {String(index).padStart(2, '0')}
                        </span>
                        <FormField
                          control={form.control}
                          name={`transactions.${index}.type`}
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <button
                                  aria-label="Toggle transaction type"
                                  tabIndex={-1}
                                  type="button"
                                  className={cn(
                                    'text-2xs font-mono font-bold px-1 py-0.5 rounded-sm leading-none transition-colors',
                                    {
                                      'text-destructive bg-destructive/10 hover:bg-destructive/20': isExpense,
                                      'text-success bg-success/10 hover:bg-success/20': !isExpense,
                                    },
                                  )}
                                  onClick={() => field.onChange(nextType)}
                                >
                                  {isExpense ? 'E' : 'I'}
                                </button>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`transactions.${index}.isDraft`}
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Checkbox
                                  aria-label="Draft"
                                  checked={field.value}
                                  tabIndex={-1}
                                  className="h-3 w-3"
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </TableCell>

                    {/* ── Amount ───────────────────────────────────────────── */}
                    <TableCell className={cell}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.amount`}
                        render={({ field, fieldState }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                {...field}
                                id={`txn-amount-${index}`}
                                min="0.01"
                                placeholder="0.00"
                                step="any"
                                type="number"
                                value={field.value ?? ''}
                                className={cn(inputBase, 'font-mono w-full', {
                                  'ring-1 ring-destructive border-destructive': fieldState.error,
                                })}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* ── Category ─────────────────────────────────────────── */}
                    <TableCell className={cell}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.category`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <CategoryTypeahead
                              disabled={field.disabled}
                              multiple={false}
                              name={field.name}
                              type={type}
                              value={field.value != null ? String(field.value) : null}
                              className={cn(typeaheadBase, 'w-full', {
                                'text-muted-foreground': !field.value,
                              })}
                              onBlur={field.onBlur}
                              onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                              ref={field.ref}
                            />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* ── Account ──────────────────────────────────────────── */}
                    <TableCell className={cell}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.account`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <AccountTypeahead
                              disabled={field.disabled}
                              multiple={false}
                              name={field.name}
                              value={field.value != null ? String(field.value) : null}
                              className={cn(typeaheadBase, 'w-full', {
                                'text-muted-foreground': !field.value,
                              })}
                              onBlur={field.onBlur}
                              onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                              ref={field.ref}
                            />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* ── Note ─────────────────────────────────────────────── */}
                    <TableCell className={cell}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.note`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Note…"
                                value={field.value ?? ''}
                                className={cn(inputBase, 'w-full')}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* ── Date ─────────────────────────────────────────────── */}
                    <TableCell className={cell}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.executedAt`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                {...field}
                                type="datetime-local"
                                className={cn(inputBase, 'font-mono')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Tab' && !e.shiftKey && isLastRow) {
                                    e.preventDefault();
                                    addRow();
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* ── Delete ───────────────────────────────────────────── */}
                    <TableCell className={cn(cell, 'text-right pr-1')}>
                      <Button
                        aria-label={`Remove row ${index}`}
                        size="icon"
                        tabIndex={-1}
                        type="button"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-destructive transition-colors"
                        onClick={() => removeRow(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </form>
    </Form>
  );
};

export default BulkCreateTableForm;
