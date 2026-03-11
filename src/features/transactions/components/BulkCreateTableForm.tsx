import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownCircle, ArrowUpCircle, Plus, Save, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';
import { useForm as useFormContext } from '@/contexts/Form';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import { cn } from '@/lib/utils';

import { useMutations } from '../api/mutations';
import { Type as TransactionType } from '../types';

const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  account: z.number().int().positive().optional(),
  amount: z.number({ invalid_type_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  category: z.number().int().positive().optional(),
  executedAt: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
  isDraft: z.boolean().default(true),
});

const formSchema = z.object({
  transactions: z.array(transactionSchema),
});

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

const compactControl = 'h-9 text-sm';
const compactIconBtn = 'h-9 w-9 p-0';
const cellY = 'py-1 align-top';
const noteClass = 'h-9 min-h-9 resize-none overflow-hidden text-sm leading-normal py-2';
const fieldError = 'text-xs mt-0.5';

export const BulkCreateTableForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();
  const { submitForm, closeForm } = useFormContext();
  const { bulkCreate } = useMutations();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { transactions: [createDefaultRow()] },
    mode: 'onChange',
  });

  const { fields, append, replace } = useFieldArray({
    control: form.control,
    name: 'transactions',
  });

  const addRow = useCallback(() => {
    append(createDefaultRow());
  }, [append]);

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
    toast.error('Please select Account and Category for each row before saving.');
    return false;
  }, []);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!validateRequired(data.transactions)) return;

      setIsSubmitting(true);
      try {
        await bulkCreate(
          data.transactions.map((t) => ({
            ...t,
          })) as unknown as import('@/features/transactions/models/Transaction').default[],
        );
        toast.success(`${data.transactions.length} transaction(s) created successfully!`);
        submitForm(data);
        closeForm();
      } catch (e) {
        console.error(e);
        toast.error('Failed to submit transactions. Please review data and try again.');
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
      { windows: 'Ctrl+N', mac: 'Ctrl+N', description: 'Add another transaction row' },
      { windows: 'Ctrl+S', mac: 'Cmd+S', description: 'Save all transactions' },
      { windows: 'Ctrl+X', mac: 'Ctrl+X', description: 'Remove last transaction row' },
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
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          {/* TODO: account & category typeaheads, executedAt should be slighlty wider at expense of note  */}
          <Table className="min-w-[860px] table-fixed">
            <colgroup>
              <col className="w-20" />
              <col className="w-[220px]" />
              <col className="w-32" />
              <col className="w-[180px]" />
              <col />
              <col className="w-44" />
              <col className="w-12" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Draft</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Executed At</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {fields.map((row, index) => {
                const type = form.watch(`transactions.${index}.type`);
                const autoFocusCategory = index === fields.length - 1;

                return (
                  <TableRow key={row.id}>
                    <TableCell className={cellY}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.isDraft`}
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-2 space-y-0 pt-2.5">
                            <FormLabel className="text-[0.7rem] text-muted-foreground">
                              <code>#{index}</code>
                            </FormLabel>
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    <TableCell className={cellY}>
                      <div className="flex items-start gap-1">
                        <FormField
                          control={form.control}
                          name={`transactions.${index}.type`}
                          render={({ field }) => {
                            const isExpense = field.value === TransactionType.Expense;
                            const next = isExpense ? TransactionType.Income : TransactionType.Expense;
                            return (
                              <FormItem className="space-y-0 shrink-0">
                                <FormControl>
                                  <Button
                                    aria-label="Toggle transaction type"
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                    className={compactIconBtn}
                                    onClick={() => field.onChange(next)}
                                  >
                                    {isExpense ? (
                                      <ArrowDownCircle className="h-4 w-4 text-destructive" />
                                    ) : (
                                      <ArrowUpCircle className="h-4 w-4 text-success" />
                                    )}
                                  </Button>
                                </FormControl>
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name={`transactions.${index}.category`}
                          render={({ field }) => (
                            <FormItem className="space-y-0 min-w-0 flex-1">
                              <FormLabel className="sr-only">Category</FormLabel>
                              <CategoryTypeahead
                                autoFocus={autoFocusCategory}
                                disabled={field.disabled}
                                multiple={false}
                                name={field.name}
                                type={type}
                                value={field.value != null ? String(field.value) : null}
                                className={cn(compactControl, 'w-full justify-between', {
                                  'text-muted-foreground': !field.value,
                                })}
                                onBlur={field.onBlur}
                                onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                                ref={field.ref}
                              />
                              <FormMessage className={fieldError} />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TableCell>

                    <TableCell className={cellY}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                {...field}
                                min="0.01"
                                placeholder="0"
                                step="any"
                                type="number"
                                value={field.value ?? ''}
                                className={cn(compactControl, 'w-full')}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                            <FormMessage className={fieldError} />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    <TableCell className={cellY}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.account`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormLabel className="sr-only">Account</FormLabel>
                            <AccountTypeahead
                              disabled={field.disabled}
                              multiple={false}
                              name={field.name}
                              value={field.value != null ? String(field.value) : null}
                              className={cn(compactControl, 'w-full justify-between', {
                                'text-muted-foreground': !field.value,
                              })}
                              onBlur={field.onBlur}
                              onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                              ref={field.ref}
                            />
                            <FormMessage className={fieldError} />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    <TableCell className={cellY}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.note`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Textarea {...field} placeholder="Add a note..." className={noteClass} />
                            </FormControl>
                            <FormMessage className={fieldError} />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    <TableCell className={cellY}>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.executedAt`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input type="datetime-local" {...field} className={compactControl} />
                            </FormControl>
                            <FormMessage className={fieldError} />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    <TableCell className={cellY}>
                      <Button
                        aria-label={`Remove row ${index}`}
                        size="icon"
                        type="button"
                        variant="ghost"
                        className={compactIconBtn}
                        onClick={() => removeRow(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="shrink-0 border-t bg-background px-4 py-3 flex justify-end gap-2">
          <Button disabled={isSubmitting} type="button" variant="outline" className="h-9" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" /> Add Row
          </Button>
          <Button disabled={isSubmitting} type="submit" className="h-9">
            <Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Saving…' : 'Save All'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BulkCreateTableForm;
