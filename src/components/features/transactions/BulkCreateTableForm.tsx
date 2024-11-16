import { zodResolver } from '@hookform/resolvers/zod';
import cn from 'classnames';
import { ArrowDownCircle, ArrowUpCircle, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import * as z from 'zod';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
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
  account: z.number().int().positive(),
  amount: z.number().min(0, 'Amount must be non-negative'),
  category: z.number().int().positive(),
  executedAt: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
  isDraft: z.boolean().default(true),
});

const formSchema = z.object({
  transactions: z.array(transactionSchema),
});

type FormValues = z.infer<typeof formSchema>

export const BulkCreateTableForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

  const { createTransaction } = useTransactionMutations();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactions: [{
        isDraft: false,
        account: undefined,
        amount: 0,
        type: TransactionType.Expense,
        category: undefined,
        note: undefined,
        executedAt: moment().format(MOMENT_DATETIME_FORM_FORMAT),
      }],
    },
  });

  const { fields, append, replace } = useFieldArray({
    control: form.control,
    name: 'transactions',
  });

  const handleRemove = async (index: number) => {
    const currentTransactions = form.getValues().transactions;
    if (currentTransactions.length === 1) {
      form.reset({
        transactions: [{
          isDraft: false,
          account: '',
          amount: '',
          isExpense: true,
          category: '',
          note: '',
          executedAt: moment().format(MOMENT_DATETIME_FORM_FORMAT),
        }],
      });
    } else {
      const newTransactions = currentTransactions.filter((_, i) => i !== index);
      replace(newTransactions);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const successfulIndices: number[] = [];
    const failedIndices: number[] = [];

    for (let i = 0; i < data.transactions.length; i++) {
      const transaction = data.transactions[i];
      try {
        await createTransaction(transaction);
        successfulIndices.push(i);
      } catch (error) {
        console.error('Transaction submission failed:', error);
        failedIndices.push(i);
        toast.error(`Failed to submit transaction for ${transaction.amount}. Please try again.`);
      }
    }

    // Remove successful transactions
    for (let i = successfulIndices.length - 1; i >= 0; i--) {
      await handleRemove(successfulIndices[i]);
    }

    form.reset({
      transactions: [{
        account: '',
        amount: '',
        isExpense: true,
        category: '',
        note: '',
        executedAt: moment().format(MOMENT_DATETIME_FORM_FORMAT),
        isDraft: false,
      }],
    });

    if (failedIndices.length > 0) {
      toast.warning(`${failedIndices.length} transaction(s) failed to submit. Please review and try again.`);
    }

    setIsSubmitting(false);
  };

  const addAnotherTransaction = () => append({
    isDraft: false,
    account: '',
    amount: 0,
    type: TransactionType.Expense,
    category: '',
    note: '',
    executedAt: moment().format(MOMENT_DATETIME_FORM_FORMAT),
  });


  useHotkeys('ctrl+n', (event) => {
    event.preventDefault();
    addAnotherTransaction();
  });
  useHotkeys('ctrl+s', (event) => {
    event.preventDefault();
    form.handleSubmit(onSubmit)();
  });
  useHotkeys('ctrl+x', (event) => {
    event.preventDefault();
    handleRemove(fields.length - 1);
  });

  useEffect(() => {
    const hotkeys = [{
      windows: 'Ctrl+N',
      mac: 'Ctrl+N',
      description: 'Add another transaction when in bulk creation mode',
    }, {
      windows: 'Ctrl+S',
      mac: 'Cmd+S',
      description: 'Save all transactions',
    }, {
      windows: 'Ctrl+X',
      mac: 'Ctrl+X',
      description: 'Remove last transaction from the list',
    }];
    addPageHotkeys('Bulk Transaction Creation', hotkeys);

    return () => {
      removePageHotkeys('Bulk Transaction Creation');
    };
  }, [addPageHotkeys, removePageHotkeys]);

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 bg-primary/50 dark:bg-primary/10 flex items-center justify-center z-50">
          <div className="bg-background p-4 rounded-lg flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Submitting transactions...</span>
          </div>
        </div>
      )}
      <Form{...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Draft</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Executed At</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="text-right">
                    <FormField
                      control={form.control}
                      name={`transactions.${index}.isDraft`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormLabel><code>#{index}</code></FormLabel>
                          <FormControl className="p-0 m-0">
                            <Checkbox
                              checked={field.value}
                              className="p-0 m-0"
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      name={`transactions.${index}.category`}
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Category</FormLabel>
                          <CategoryTypeahead
                            {...field}
                            autoFocus
                            multiple={false}
                            type={form.watch(`transactions.${index}.type`)}
                            className={cn('w-full justify-between', {
                              'text-muted-foreground': !field.value,
                            })}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <FormField
                          control={form.control}
                          name={`transactions.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  autoFocus={false}
                                  type="number"
                                  placeholder="Amount"
                                  className="w-full"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="w-8 h-8 p-0"
                                onClick={() => field.onChange(field.value === TransactionType.Expense ? TransactionType.Income : TransactionType.Expense)}
                              >
                                {field.value === TransactionType.Expense &&
                                  <ArrowDownCircle className="h-4 w-4 text-destructive" />}
                                {field.value === TransactionType.Income &&
                                  <ArrowUpCircle className="h-4 w-4 text-success" />}
                              </Button>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <FormField
                      name={`transactions.${index}.account`}
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Account</FormLabel>
                          <AccountTypeahead
                            {...field}
                            multiple={false}
                            className={cn('w-full justify-between', {
                              'text-muted-foreground': !field.value,
                            })}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`transactions.${index}.note`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Add a note..."
                              className="min-h-[2.5rem] resize-none overflow-hidden"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`transactions.${index}.executedAt`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="w-[50px]">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemove(index)}
                        className="w-8 h-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end items-center space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 py-2 text-sm font-medium"
              onClick={addAnotherTransaction}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
            <Button
              type="submit"
              variant="default"
              className="h-10 px-4 py-2 text-sm font-medium"
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default BulkCreateTableForm;
