import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import moment from 'moment';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';
import { useForm as useFormContext } from '@/contexts/Form';
import { AccountTypeahead } from '@/features/accounts';
import { CategoryTypeahead } from '@/features/categories';
import { DebtTypeahead } from '@/features/debts';
import { Type as TransactionType } from '@/features/transactions';
import { useMutations } from '@/features/transactions/api/mutations';
import type Transaction from '@/features/transactions/models/Transaction';
import { useFormLogic } from '@/hooks/useFormLogic';
import { cn } from '@/lib/utils';

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface TransactionFormProps {
  key: string;
}

interface TransactionFormRef {
  submitForm: () => Promise<void>;
}

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

// ── Component ─────────────────────────────────────────────────────────────────

export const TransactionForm = forwardRef<TransactionFormRef, TransactionFormProps>((_, ref) => {
  const { create: createTransaction, update: updateTransaction } = useMutations();
  const {
    updateFormState,
    formState: { values: rawData },
  } = useFormContext();

  const data = rawData as TransactionData | null | undefined;
  const [showDebt, setShowDebt] = useState(!!data?.debt?.id);

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

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'compensations' });

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

  useHotkeys(
    'meta+enter,ctrl+enter',
    (e) => {
      e.preventDefault();
      void formRef.current?.submitForm();
    },
    {
      enableOnFormTags: true,
    },
  );

  // ── Derived class strings (computed before return to avoid JSX ternaries) ──

  const transactionType = form.watch('type');
  const isDraft = form.watch('isDraft');
  const isExpense = transactionType === TransactionType.Expense;
  const typeLabel = isExpense ? 'EXPENSE' : 'INCOME';

  const typeChipClass = cn(
    'text-2xs font-mono font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border cursor-pointer select-none transition-colors',
    {
      'bg-destructive/10 text-destructive border-destructive/20': isExpense,
      'bg-success/10 text-success border-success/20': !isExpense,
    },
  );

  const draftChipClass = cn(
    'text-2xs font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border cursor-pointer select-none transition-colors',
    {
      'bg-warning/10 text-warning border-warning/20': isDraft,
      'text-muted-foreground border-transparent hover:border-border': !isDraft,
    },
  );

  const debtChipClass = cn(
    'text-2xs font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border cursor-pointer select-none transition-colors',
    {
      'bg-muted text-foreground border-border': showDebt,
      'text-muted-foreground border-transparent hover:border-border': !showDebt,
    },
  );

  return (
    <Form {...form}>
      <form className="space-y-1.5">
        {/* ── Command bar ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-9 px-2 mb-1 rounded-md bg-muted/30 border">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <button
                tabIndex={-1}
                type="button"
                className={typeChipClass}
                onClick={() => field.onChange(isExpense ? TransactionType.Income : TransactionType.Expense)}
              >
                {typeLabel}
              </button>
            )}
          />
          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="isDraft"
              render={({ field }) => (
                <button
                  tabIndex={-1}
                  type="button"
                  className={draftChipClass}
                  onClick={() => field.onChange(!field.value)}
                >
                  [d] draft
                </button>
              )}
            />
            <button tabIndex={-1} type="button" className={debtChipClass} onClick={() => setShowDebt((v) => !v)}>
              [debt]
            </button>
            <span className="text-[9px] text-muted-foreground font-mono select-none">⌘↵</span>
          </div>
        </div>

        {/* ── Optional debt row ─────────────────────────────────────────── */}
        {showDebt && (
          <FormField
            control={form.control}
            name="debt"
            render={({ field }) => (
              <FormItem>
                <DebtTypeahead
                  disabled={field.disabled}
                  multiple={false}
                  name={field.name}
                  value={field.value != null ? String(field.value) : null}
                  className={cn('w-full h-7 text-xs', {
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
        )}

        {/* ── Row 1: Category · Account · Amount ───────────────────────── */}
        <div className="flex gap-1.5">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="flex-[2] min-w-0">
                <CategoryTypeahead
                  autoFocus
                  disabled={field.disabled}
                  multiple={false}
                  name={field.name}
                  type={transactionType}
                  value={field.value != null ? String(field.value) : null}
                  className={cn('w-full h-7 text-xs', {
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
            name="account"
            render={({ field }) => (
              <FormItem className="flex-[2] min-w-0">
                <AccountTypeahead
                  disabled={field.disabled}
                  multiple={false}
                  name={field.name}
                  size="sm"
                  value={field.value != null ? String(field.value) : null}
                  className={cn('w-full', {
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
            name="amount"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0">
                <FormLabel className="sr-only">Amount</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    min="0"
                    placeholder="0.00"
                    step="any"
                    type="number"
                    value={field.value ?? ''}
                    className="h-7 text-xs font-mono"
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Row 2: Date · Note ────────────────────────────────────────── */}
        <div className="flex gap-1.5">
          <FormField
            control={form.control}
            name="executedAt"
            render={({ field }) => (
              <FormItem className="shrink-0">
                <FormLabel className="sr-only">Date</FormLabel>
                <FormControl>
                  <Input {...field} type="datetime-local" className="h-7 text-xs font-mono w-44" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0">
                <FormLabel className="sr-only">Note</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Note…" type="text" value={field.value ?? ''} className="h-7 text-xs" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* ── Compensations (expense only) ──────────────────────────────── */}
        {isExpense && (
          <div className="border-t pt-2 space-y-1">
            {fields.map((field, index) => (
              <div className="flex items-start gap-1.5" key={field.id}>
                <FormField control={form.control} name={`compensations.${index}.id`} render={() => <></>} />

                <FormField
                  control={form.control}
                  name={`compensations.${index}.account`}
                  render={({ field: f }) => (
                    <FormItem className="flex-[2] min-w-0">
                      <AccountTypeahead
                        disabled={f.disabled}
                        multiple={false}
                        name={f.name}
                        size="sm"
                        value={f.value != null ? String(f.value) : null}
                        className={cn('w-full', {
                          'text-muted-foreground': !f.value,
                        })}
                        onBlur={f.onBlur}
                        onChange={(v) => f.onChange(v ? Number(v) : undefined)}
                        ref={f.ref}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`compensations.${index}.amount`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1 min-w-0">
                      <FormLabel className="sr-only">Compensation amount</FormLabel>
                      <FormControl>
                        <Input
                          {...f}
                          placeholder="0.00"
                          type="number"
                          className="h-7 text-xs font-mono"
                          onChange={(e) => f.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`compensations.${index}.executedAt`}
                  render={({ field: f }) => (
                    <FormItem className="shrink-0">
                      <FormLabel className="sr-only">Compensation date</FormLabel>
                      <FormControl>
                        <Input {...f} type="datetime-local" className="h-7 text-xs font-mono w-40" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  tabIndex={-1}
                  type="button"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            <button
              tabIndex={-1}
              type="button"
              className="flex items-center gap-1 text-2xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              onClick={() =>
                append({ account: -1, amount: 0, executedAt: moment().format(MOMENT_DATETIME_FORM_FORMAT) })
              }
            >
              <Plus className="h-3 w-3" />
              ADD COMP
            </button>
          </div>
        )}
      </form>
    </Form>
  );
});

TransactionForm.displayName = 'TransactionForm';

export default TransactionForm;
