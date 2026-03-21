import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftRight, Plus, Trash2, X } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { nowDatetimeLocal, toDatetimeLocal } from '@/lib/datetime/toDatetimeLocal';
import { useForm as useFormContext } from '@/contexts/Form';
import { AccountTypeahead } from '@/features/accounts';
import { useAccountsWithDefaultOrder } from '@/hooks/financeData';
import { confirm } from '@/lib/confirmation';
import { useFormLogic } from '@/hooks/useFormLogic';
import { cn } from '@/lib/utils';

import Transfer from '../models/Transfer';
import { useMutations } from '../api';

const feeRowSchema = z.object({
  amount: z.number().min(0, 'Fee must be non-negative').optional(),
  account: z.number().int().positive().optional(),
  included: z.boolean().default(false),
});

const formSchema = z
  .object({
    from: z.number().int().positive(),
    to: z.number().int().positive(),
    amount: z.number().min(0, 'Amount must be a positive number'),
    rate: z.number().min(0, 'Rate must be a positive number'),
    fees: z.array(feeRowSchema),
    executedAt: z.string().min(1, 'Date is required'),
    note: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    const filledAccounts = v.fees
      .filter((f) => f.amount != null && f.amount > 0 && f.account != null)
      .map((f) => f.account!);
    const seen = new Set<number>();
    for (const acc of filledAccounts) {
      if (seen.has(acc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate fee account — merge into one row',
          path: ['fees'],
        });
        break;
      }
      seen.add(acc);
    }

    // included only valid for fees from the sender account
    for (const [i, f] of v.fees.entries()) {
      if (f.included && f.account != null && f.account !== v.from) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Only fees from the From account can be included',
          path: ['fees', i, 'included'],
        });
      }
    }

    const includedTotal = v.fees
      .filter((f) => f.included && f.amount != null && f.amount > 0)
      .reduce((sum, f) => sum + (f.amount ?? 0), 0);
    if (includedTotal > v.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Included fees cannot exceed Amount',
        path: ['fees'],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;
type RateMode = 'toPerFrom' | 'fromPerTo';

interface TransferFormRef {
  submitForm: () => Promise<void>;
}

const EMPTY_FEE_ROW = {
  amount: undefined as number | undefined,
  account: undefined as number | undefined,
  included: false,
};

export const TransferForm = forwardRef<TransferFormRef>((_, ref) => {
  const accounts = useAccountsWithDefaultOrder();
  const { submitForm, updateFormState, formState, closeForm } = useFormContext();
  const { create: createTransfer, update: updateTransfer, delete: deleteTransfer, isDeleting } = useMutations();

  const initialTransfer = formState.values instanceof Transfer ? (formState.values as Transfer) : null;
  const isEditMode = !!initialTransfer;

  const [rateMode, setRateMode] = useState<RateMode>('toPerFrom');
  const [rateText, setRateText] = useState('0');

  const initialFees =
    initialTransfer && initialTransfer.feeExpenses.length > 0
      ? initialTransfer.feeExpenses.map((tx) => ({
          amount: Math.abs(tx.amount),
          account: tx.account.id,
          included: false,
        }))
      : [{ ...EMPTY_FEE_ROW }];

  const defaultValues = {
    from: initialTransfer?.fromExpense.account.id,
    to: initialTransfer?.toIncome.account.id,
    amount: initialTransfer ? Math.abs(initialTransfer.fromExpense.amount) : 0,
    rate: initialTransfer?.rate ?? 0,
    fees: initialFees,
    executedAt: initialTransfer ? toDatetimeLocal(initialTransfer.executedAt) : nowDatetimeLocal(),
    note: initialTransfer?.note || undefined,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { control, setValue } = form;

  const { fields, append, remove, update: updateField } = useFieldArray({ control, name: 'fees' });

  const from = useWatch({ control, name: 'from' });
  const to = useWatch({ control, name: 'to' });
  const amount = useWatch({ control, name: 'amount' });
  const rate = useWatch({ control, name: 'rate' });
  const fees = useWatch({ control, name: 'fees' });

  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeRate = Number.isFinite(rate) ? rate : 0;

  const fromCurrency = useMemo(() => {
    if (!Number.isFinite(from as number)) return undefined;
    return accounts.find((a) => a.id === from)?.currency;
  }, [from, accounts]);

  const toCurrency = useMemo(() => {
    if (!Number.isFinite(to as number)) return undefined;
    return accounts.find((a) => a.id === to)?.currency;
  }, [to, accounts]);

  const filledFees = useMemo(
    () => (fees ?? []).filter((f) => f.amount != null && f.amount > 0 && f.account != null),
    [fees],
  );

  const includedSenderFees = useMemo(
    () =>
      filledFees
        .filter((f) => f.included && f.account === from)
        .reduce((sum, f) => sum + (f.amount ?? 0), 0),
    [filledFees, from],
  );

  const summary = useMemo(() => {
    const netFrom = Math.max(safeAmount - includedSenderFees, 0);
    const netTo = netFrom * safeRate;
    return { netFrom, netTo };
  }, [safeAmount, safeRate, includedSenderFees]);

  // Turn off "included" for any fee whose account changed away from sender
  useEffect(() => {
    for (const [i, f] of (fees ?? []).entries()) {
      if (f.included && f.account != null && f.account !== from) {
        setValue(`fees.${i}.included`, false, { shouldValidate: true });
      }
    }
  }, [fees, from, setValue]);

  useEffect(() => {
    const displayed = rateMode === 'toPerFrom' ? safeRate : safeRate > 0 ? 1 / safeRate : 0;
    setRateText(String(Number.isFinite(displayed) ? displayed : 0));
  }, [rateMode, safeRate]);

  const normalizeRateOnBlur = () => {
    const raw = rateText.replace(',', '.').trim();
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      setValue('rate', 0, { shouldDirty: true, shouldValidate: true });
      setRateText('0');
      return;
    }
    if (rateMode === 'toPerFrom') {
      setValue('rate', n, { shouldDirty: true, shouldValidate: true });
    } else {
      setValue('rate', 1 / n, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleRemoveFee = (index: number) => {
    if (fields.length === 1) {
      updateField(0, { ...EMPTY_FEE_ROW });
    } else {
      remove(index);
    }
  };

  const { formRef } = useFormLogic({
    form,
    setFormState: updateFormState,
    onSubmit: async (values: FormValues) => {
      try {
        const submitFees = values.fees
          .filter((f) => f.amount != null && f.amount > 0 && f.account != null)
          .map((f) => ({ amount: f.amount!, account: f.account! }));

        const includedTotal = values.fees
          .filter((f) => f.included && f.amount != null && f.amount > 0 && f.account === values.from)
          .reduce((sum, f) => sum + (f.amount ?? 0), 0);

        const payloadAmount = includedTotal > 0 ? Math.max(values.amount - includedTotal, 0) : values.amount;

        const payload = {
          from: values.from,
          to: values.to,
          amount: payloadAmount,
          rate: values.rate,
          fees: submitFees,
          executedAt: values.executedAt,
          note: values.note || '',
        };

        if (isEditMode) {
          await updateTransfer({ id: initialTransfer!.id, ...payload });
          toast.success('Transfer updated.');
        } else {
          await createTransfer(payload);
          toast.success('Transfer created.');
        }

        submitForm(values);
      } catch (error: unknown) {
        toast.error('Failed to save transfer. Please try again.', {
          description:
            typeof error === 'object' && error !== null && 'message' in error
              ? String((error as { message: unknown }).message)
              : undefined,
        });
        throw error;
      }
    },
  });

  useHotkeys(
    'meta+enter,ctrl+enter',
    () => {
      void formRef.current?.submitForm();
    },
    { enableOnFormTags: true },
  );

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete transfer?',
      description: `Transfer #${initialTransfer!.id} will be permanently deleted. This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      await deleteTransfer(initialTransfer!.id);
      closeForm();
    } catch {
      // mutation already shows toast
    }
  };

  useImperativeHandle(ref, () => formRef.current!);

  const pairLabel =
    fromCurrency && toCurrency
      ? rateMode === 'toPerFrom'
        ? `${toCurrency}/${fromCurrency}`
        : `${fromCurrency}/${toCurrency}`
      : rateMode === 'toPerFrom'
        ? 'TO/FROM'
        : 'FROM/TO';

  const receiveValue =
    Number.isFinite(summary.netTo) && summary.netTo >= 0
      ? `${summary.netTo.toFixed(2)}${toCurrency ? ` ${toCurrency}` : ''}`
      : `0.00${toCurrency ? ` ${toCurrency}` : ''}`;

  return (
    <Form {...form}>
      <form aria-label="Transfer form" className="flex flex-col gap-2">
        {/* Command bar */}
        <div className="flex items-center gap-1 px-1 py-0.5">
          <span className="h-6 px-2 rounded border font-mono text-2xs uppercase tracking-wider bg-muted text-foreground border-border flex items-center">
            transfer
          </span>
          <span className="ml-auto font-mono text-2xs text-muted-foreground select-none">⌘↵</span>
        </div>

        {/* Row 1: From · To */}
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={control}
            name="from"
            render={({ field }) => (
              <FormItem>
                <AccountTypeahead
                  aria-label="From account"
                  disabled={field.disabled}
                  multiple={false}
                  name={field.name}
                  size="sm"
                  value={field.value != null ? String(field.value) : null}
                  className={cn('w-full', { 'text-muted-foreground': !field.value })}
                  onBlur={field.onBlur}
                  onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  ref={field.ref}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="to"
            render={({ field }) => (
              <FormItem>
                <AccountTypeahead
                  aria-label="To account"
                  disabled={field.disabled}
                  multiple={false}
                  name={field.name}
                  size="sm"
                  value={field.value != null ? String(field.value) : null}
                  className={cn('w-full', { 'text-muted-foreground': !field.value })}
                  onBlur={field.onBlur}
                  onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  ref={field.ref}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: Amount · Rate · Receives */}
        <div className="grid grid-cols-3 gap-2">
          <FormField
            control={control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      aria-label={`Amount${fromCurrency ? ` in ${fromCurrency}` : ''}`}
                      inputMode="decimal"
                      min="0"
                      placeholder="Amount"
                      step="any"
                      type="number"
                      className="h-7 text-xs pr-10"
                      onChange={(e) => {
                        const n = e.target.valueAsNumber;
                        field.onChange(Number.isFinite(n) ? n : 0);
                      }}
                    />
                    {fromCurrency && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs font-mono text-muted-foreground pointer-events-none">
                        {fromCurrency}
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <div className="relative">
              <Button
                aria-label="Toggle rate view"
                aria-pressed={rateMode === 'fromPerTo'}
                size="icon"
                type="button"
                variant="ghost"
                className="absolute left-0 top-0 h-7 w-7 z-10"
                onClick={() => setRateMode((m) => (m === 'toPerFrom' ? 'fromPerTo' : 'toPerFrom'))}
              >
                <ArrowLeftRight className="h-3 w-3" />
              </Button>
              <Input
                aria-label={`Exchange rate (${pairLabel})`}
                inputMode="decimal"
                placeholder="Rate"
                type="text"
                value={rateText}
                className="h-7 text-xs pl-8 pr-10"
                onBlur={normalizeRateOnBlur}
                onChange={(e) => setRateText(e.target.value)}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs font-mono text-muted-foreground pointer-events-none whitespace-nowrap">
                {pairLabel}
              </span>
            </div>
          </FormItem>

          <div
            aria-label={`They receive${toCurrency ? ` in ${toCurrency}` : ''}`}
            className="h-7 flex items-center px-2 rounded-md border bg-muted/40 text-xs tabular-nums text-muted-foreground"
          >
            <span className="truncate">{receiveValue}</span>
          </div>
        </div>

        {/* Fee rows — always visible, submitted only if filled */}
        <div className="flex flex-col gap-1">
          {fields.map((field, index) => {
            const feeAccount = fees?.[index]?.account;
            const feeCurrency = feeAccount != null ? accounts.find((a) => a.id === feeAccount)?.currency : undefined;
            const isSenderFee = feeAccount != null && feeAccount === from;
            const isIncluded = fees?.[index]?.included ?? false;

            return (
              <div className="flex gap-2 items-center" key={field.id}>
                <FormField
                  control={control}
                  name={`fees.${index}.amount`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1 min-w-0">
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...f}
                            aria-label={`Fee ${index + 1} amount`}
                            inputMode="decimal"
                            min="0"
                            placeholder="Fee"
                            step="any"
                            type="number"
                            value={f.value ?? ''}
                            className="h-7 text-xs pr-10"
                            onChange={(e) => {
                              const n = e.target.valueAsNumber;
                              f.onChange(Number.isFinite(n) ? n : undefined);
                            }}
                          />
                          {(feeCurrency ?? fromCurrency) && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs font-mono text-muted-foreground pointer-events-none">
                              {feeCurrency ?? fromCurrency}
                            </span>
                          )}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`fees.${index}.account`}
                  render={({ field: f }) => (
                    <FormItem className="flex-[2] min-w-0">
                      <AccountTypeahead
                        aria-label={`Fee ${index + 1} account`}
                        disabled={f.disabled}
                        multiple={false}
                        name={f.name}
                        size="sm"
                        value={f.value != null ? String(f.value) : null}
                        className={cn('w-full', { 'text-muted-foreground': !f.value })}
                        onBlur={f.onBlur}
                        onChange={(v) => f.onChange(v ? Number(v) : undefined)}
                        ref={f.ref}
                      />
                    </FormItem>
                  )}
                />

                {/* incl chip — only for sender-account fees */}
                {isSenderFee ? (
                  <button
                    type="button"
                    className={cn(
                      'h-7 px-2 rounded border font-mono text-2xs uppercase tracking-wider transition-colors shrink-0',
                      {
                        'bg-muted text-foreground border-border': isIncluded,
                        'text-muted-foreground border-transparent hover:border-border': !isIncluded,
                      },
                    )}
                    onClick={() => setValue(`fees.${index}.included`, !isIncluded, { shouldValidate: true })}
                  >
                    incl
                  </button>
                ) : (
                  <button
                    aria-label={`Remove fee ${index + 1}`}
                    type="button"
                    className="h-7 w-7 flex items-center justify-center rounded border border-transparent text-muted-foreground hover:text-destructive hover:border-border transition-colors shrink-0"
                    onClick={() => handleRemoveFee(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add fee + array-level errors */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-6 px-2 rounded border border-transparent font-mono text-2xs text-muted-foreground hover:border-border transition-colors flex items-center gap-1"
              onClick={() => append({ ...EMPTY_FEE_ROW })}
            >
              <Plus className="h-3 w-3" />
              add
            </button>

            <FormField
              control={control}
              name="fees"
              render={() => <FormMessage />}
            />
          </div>
        </div>

        {/* Row 3: Date · Note */}
        <div className="flex gap-2">
          <FormField
            control={control}
            name="executedAt"
            render={({ field }) => (
              <FormItem className="w-44 shrink-0">
                <FormControl>
                  <Input {...field} aria-label="Executed at" type="datetime-local" className="h-7 text-xs" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="note"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0">
                <FormControl>
                  <Input {...field} aria-label="Note" placeholder="Note…" className="h-7 text-xs" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Delete (edit mode) — FormRenderer handles save */}
        {isEditMode && (
          <Button
            disabled={isDeleting}
            type="button"
            variant="ghost"
            className="w-full h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            {isDeleting ? 'Deleting…' : 'Delete Transfer'}
          </Button>
        )}
      </form>
    </Form>
  );
});

TransferForm.displayName = 'TransferForm';
export default TransferForm;
