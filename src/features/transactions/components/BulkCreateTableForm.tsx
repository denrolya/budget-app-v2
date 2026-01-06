import { zodResolver } from '@hookform/resolvers/zod';
import cn from 'classnames';
import { ArrowDownCircle, ArrowUpCircle, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import * as z from 'zod';

import AccountTypeahead from '@/features/accounts/components/AccountTypeahead';
import CategoryTypeahead from '@/features/categories/components/CategoryTypeahead';
import { CSVUploader } from '@/features/transactions/components/CSVUploader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { useTransactionMutations } from '@/hooks/useTransactionMutations';
import { Type as TransactionType } from '@/types/transaction';

const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  account: z.number().int().positive().optional(),
  amount: z.number().min(0, 'Amount must be non-negative'),
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

const SubmittingOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-primary/50 dark:bg-primary/10 flex items-center justify-center z-50">
    <div className="bg-background p-4 rounded-lg flex items-center gap-2 shadow">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span>Submitting transactions...</span>
    </div>
  </div>
);

const missingRequired = (t: TransactionRow) => !t.account || !t.category;

export const BulkCreateTableForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();
  const { createTransaction } = useTransactionMutations();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { transactions: [createDefaultRow()] },
    mode: 'onSubmit',
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
    const hasMissing = rows.some(missingRequired);
    if (!hasMissing) return true;
    toast.error('Please select Account and Category for each row before saving.');
    return false;
  }, []);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!validateRequired(data.transactions)) return;

      setIsSubmitting(true);

      const ok: number[] = [];
      let failed = 0;

      for (let i = 0; i < data.transactions.length; i++) {
        try {
          await createTransaction(data.transactions[i]);
          ok.push(i);
        } catch {
          failed += 1;
          toast.error(`Failed to submit row #${i}.`);
        }
      }

      const remaining = data.transactions.filter((_, idx) => !ok.includes(idx));
      replace(remaining.length ? remaining : [createDefaultRow()]);

      if (failed > 0) toast.warning(`${failed} transaction(s) failed. Please review and try again.`);

      setIsSubmitting(false);
    },
    [createTransaction, replace, validateRequired],
  );

  // Hotkeys
  useHotkeys(
    'ctrl+n',
    (event) => {
      event.preventDefault();
      addRow();
    },
    [addRow],
  );

  useHotkeys(
    'ctrl+s,cmd+s',
    (event) => {
      event.preventDefault();
      form.handleSubmit(onSubmit)();
    },
    [form, onSubmit],
  );

  useHotkeys(
    'ctrl+x',
    (event) => {
      event.preventDefault();
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

    return () => {
      removePageHotkeys('Bulk Transaction Creation');
    };
  }, [addPageHotkeys, removePageHotkeys]);

  // Compact styling
  const compactControl = 'h-8 text-sm';
  const compactIconBtn = 'h-8 w-8 p-0';
  const cellY = 'py-0.5';
  const noteClass = 'h-8 min-h-8 resize-none overflow-hidden text-sm leading-6';

  // IMPORTANT: reserve space for sticky footer so last row never sits under it
  const footerReserve = 'pb-14';

  // Keep your original header layout (grid)
  const gridHeader = useMemo(() => 'grid grid-cols-7 w-full', []);

  return (
    <>
      {isSubmitting && <SubmittingOverlay />}

      <Form {...form}>
        {/* CRITICAL: isolate + z-index to ensure dropdown is above the rest of the page */}
        <form
          aria-label="Bulk create transactions"
          className="relative isolate z-40"
          onSubmit={form.handleSubmit(onSubmit)}>
          {/* Table region must be above siblings too */}
          <div className={cn('relative z-40', footerReserve)}>
            <Table>
              <TableHeader className="block w-full">
                <TableRow className={gridHeader}>
                  <TableHead>Draft</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Executed At</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              {/* Keep your original: overflow-visible so Typeahead dropdown can escape */}
              <TableBody className="block max-h-[300px] overflow-visible w-full relative z-40">
                {fields.map((row, index) => {
                  const type = form.watch(`transactions.${index}.type`);
                  const autoFocusCategory = index === fields.length - 1;

                  return (
                    <TableRow className="table w-full" key={row.id}>
                      <TableCell className={cn('text-right', cellY)}>
                        <FormField
                          control={form.control}
                          name={`transactions.${index}.isDraft`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormLabel className="text-[0.7rem] text-muted-foreground">
                                <code>#{index}</code>
                              </FormLabel>
                              <FormControl className="p-0 m-0">
                                <Checkbox checked={field.value} className="p-0 m-0" onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell className={cellY}>
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`transactions.${index}.type`}
                            render={({ field }) => {
                              const isExpense = field.value === TransactionType.Expense;
                              const next = isExpense ? TransactionType.Income : TransactionType.Expense;

                              return (
                                <FormItem className="space-y-0">
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
                              <FormItem className="space-y-0 w-full">
                                <FormLabel className="sr-only">Category</FormLabel>
                                <CategoryTypeahead
                                  {...field}
                                  autoFocus={autoFocusCategory}
                                  multiple={false}
                                  type={type}
                                  valueField="id"
                                  className={cn(compactControl, 'w-full justify-between', {
                                    'text-muted-foreground': !field.value,
                                  })}
                                />
                                <FormMessage />
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
                                  placeholder="Amount"
                                  type="number"
                                  value={field.value ?? ''}
                                  className={cn(compactControl, 'w-full')}
                                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                                />
                              </FormControl>
                              <FormMessage />
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
                                {...field}
                                multiple={false}
                                className={cn(compactControl, 'w-full justify-between', {
                                  'text-muted-foreground': !field.value,
                                })}
                              />
                              <FormMessage />
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
                              <FormMessage />
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell className={cn('w-[50px]', cellY)}>
                        <div className="flex justify-end">
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Sticky footer, but LOW z so dropdown (z-50 inside isolated context) stays above */}
          <div className="sticky bottom-0 z-10 border-t bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur">
            <div className="flex flex-wrap justify-end items-center gap-2 px-2 py-2">
              <Button disabled={isSubmitting} type="button" variant="outline" className="h-9" onClick={addRow}>
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>

              <div className="w-full sm:w-72">
                <CSVUploader onComplete={replace} />
              </div>

              <Button disabled={isSubmitting} type="submit" variant="default" className="h-9">
                <Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save All'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
};

export default BulkCreateTableForm;
