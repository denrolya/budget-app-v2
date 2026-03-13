import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react';
import moment from 'moment';
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

import { cn } from '@/lib/utils';
import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';
import { useMutations } from '@/features/transactions/api/mutations';
import { AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import { DebtTypeahead } from '@/features/debts';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm as useFormContext } from '@/contexts/Form';
import { useFormLogic } from '@/hooks/useFormLogic';
import type Transaction from '@/features/transactions/models/Transaction';
import { Type as TransactionType } from '@/features/transactions';

interface TransactionFormProps {
  key: string;
}

interface TransactionFormRef {
  submitForm: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const formSchema = z.object({
  type: z.nativeEnum(TransactionType),
  account: z.number().int().positive(),
  amount: z.number().min(0, 'Amount must be non-negative'),
  category: z.number().int().positive(),
  executedAt: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
  isDraft: z.boolean().default(false),
  debt: z.number().int().positive().optional(),
  compensations: z
    .array(
      z.object({
        id: z.number().optional(),
        account: z.number().int().positive(),
        amount: z.number().positive('Amount must be positive'),
        executedAt: z.string().min(1, 'Date is required'),
      }),
    )
    .optional(),
});

export const TransactionForm = forwardRef<TransactionFormRef, TransactionFormProps>((_, ref) => {
  const { create: createTransaction, update: updateTransaction } = useMutations();
  const {
    updateFormState,
    formState: { values: rawData },
  } = useFormContext();
  type TransactionData = {
    id?: number;
    type?: TransactionType;
    account?: { id?: number } | null;
    amount?: number;
    category?: { id?: number } | null;
    executedAt?: string | null;
    note?: string;
    isDraft?: boolean;
    debt?: { id?: number } | null;
    compensations?: Transaction[];
  };
  const data = rawData as TransactionData | null | undefined;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...data,
      type: data?.type || TransactionType.Expense,
      account: data?.account?.id,
      amount: data?.amount,
      category: data?.category?.id,
      executedAt:
        moment(data?.executedAt).format(MOMENT_DATETIME_FORM_FORMAT) || moment().format(MOMENT_DATETIME_FORM_FORMAT),
      note: data?.note,
      isDraft: data?.isDraft ?? false,
      debt: data?.debt?.id,
      compensations:
        data?.compensations?.map((comp: Transaction) => ({
          ...comp,
          account: comp?.account?.id,
          amount: comp.amount,
          executedAt: moment(comp.executedAt).format(MOMENT_DATETIME_FORM_FORMAT),
        })) || [],
    },
    mode: 'onChange',
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'compensations',
  });
  const { formRef } = useFormLogic({
    form,
    setFormState: updateFormState,
    onSubmit: async (values: z.infer<typeof formSchema>) => {
      try {
        if (data?.id) {
          await updateTransaction({
            id: data.id,
            updates: values as unknown as Partial<Transaction>,
            originalTransaction: data as unknown as Transaction,
          });
        } else {
          await createTransaction(values as unknown as Partial<Transaction>);
        }
      } catch {
        toast.error('Failed to submit transaction. Issue requires investigation.');
      }
    },
  });
  useImperativeHandle(ref, () => formRef.current!);

  const [noteHeight, setNoteHeight] = useState('auto');
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const noteValue = form.watch('note');

  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.style.height = 'auto';
      noteRef.current.style.height = `${noteRef.current.scrollHeight}px`;
    }
  }, [noteValue]);

  return (
    <Form {...form}>
      <form className="space-y-2">
        <FormField
          control={form.control}
          name="isDraft"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Draft</FormLabel>
                <p className="text-sm text-muted-foreground">This transaction will be saved as a draft.</p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <FormControl>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={field.value === TransactionType.Expense ? 'default' : 'outline'}
                    className={cn('w-full justify-start space-x-2', {
                      'bg-primary text-primary-foreground': field.value === TransactionType.Expense,
                    })}
                    onClick={() => field.onChange(TransactionType.Expense)}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    <span>Expense</span>
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === TransactionType.Income ? 'default' : 'outline'}
                    className={cn('w-full justify-start space-x-2', {
                      'bg-primary text-primary-foreground': field.value === TransactionType.Income,
                    })}
                    onClick={() => field.onChange(TransactionType.Income)}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    <span>Income</span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="debt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Debt</FormLabel>
              <DebtTypeahead
                disabled={field.disabled}
                multiple={false}
                name={field.name}
                value={field.value != null ? String(field.value) : null}
                className={cn('w-full justify-between', {
                  'text-muted-foreground': !field.value,
                })}
                onBlur={field.onBlur}
                onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                ref={field.ref}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <CategoryTypeahead
                autoFocus
                disabled={field.disabled}
                multiple={false}
                name={field.name}
                type={form.watch('type')}
                value={field.value != null ? String(field.value) : null}
                className={cn('w-full justify-between', {
                  'text-muted-foreground': !field.value,
                })}
                onBlur={field.onBlur}
                onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                ref={field.ref}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter amount"
                    type="number"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Account</FormLabel>
                <AccountTypeahead
                  disabled={field.disabled}
                  multiple={false}
                  name={field.name}
                  value={field.value != null ? String(field.value) : null}
                  className={cn('w-full justify-between', {
                    'text-muted-foreground': !field.value,
                  })}
                  onBlur={field.onBlur}
                  onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  ref={field.ref}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="executedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" className="w-full" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add a note..."
                  style={{ height: noteHeight }}
                  className="min-h-[2.5rem] resize-none overflow-hidden"
                  onChange={(e) => {
                    field.onChange(e);
                    setNoteHeight(`${e.target.scrollHeight}px`);
                  }}
                  ref={noteRef}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('type') === TransactionType.Expense && (
          <div>
            <Label>Compensations</Label>
            {fields.map((field, index) => (
              <div className="mt-2 p-2 border border-border rounded-md space-y-2" key={field.id}>
                <FormField control={form.control} name={`compensations.${index}.id`} render={() => <></>} />
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`compensations.${index}.amount`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Amount"
                            type="number"
                            className="w-full"
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`compensations.${index}.account`}
                    render={({ field }) => (
                      <FormItem>
                        <AccountTypeahead
                          disabled={field.disabled}
                          multiple={false}
                          name={field.name}
                          value={field.value != null ? String(field.value) : null}
                          className={cn('w-full justify-between', {
                            'text-muted-foreground': !field.value,
                          })}
                          onBlur={field.onBlur}
                          onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                          ref={field.ref}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`compensations.${index}.executedAt`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="datetime-local" {...field} className="w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" className="p-2 h-9 w-9" onClick={() => remove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              className="mt-2 w-full"
              onClick={() =>
                append({
                  account: -1,
                  amount: 0,
                  executedAt: moment().format(MOMENT_DATETIME_FORM_FORMAT),
                })
              }
            >
              Add Compensation
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
});

export default TransactionForm;
