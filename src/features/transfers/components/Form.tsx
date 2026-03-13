import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftRight, Trash2 } from 'lucide-react';
import moment from 'moment';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';
import { useForm as useFormContext } from '@/contexts/Form';
import { AccountTypeahead } from '@/features/accounts';
import { useAccountsWithDefaultOrder } from '@/hooks/financeData';
import { confirm } from '@/lib/confirmation';
import { useFormLogic } from '@/hooks/useFormLogic';
import { cn } from '@/lib/utils';

import Transfer from '../models/Transfer';
import { useMutations } from '../api';

const formSchema = z
  .object({
    from: z.number().int().positive(),
    to: z.number().int().positive(),
    amount: z.number().min(0, 'Amount must be a positive number'),
    rate: z.number().min(0, 'Rate must be a positive number'),
    fee: z.number().min(0, 'Fee must be non-negative').optional(),
    feeAccount: z.number().int().positive().optional(),
    executedAt: z.string().min(1, 'Date is required'),
    note: z.string().optional(),
    feeIncludedInAmount: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (v.feeAccount != null && v.fee == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fee amount is required when fee account is selected',
        path: ['fee'],
      });
    }

    if (v.feeIncludedInAmount && v.feeAccount != null && v.from != null && v.feeAccount !== v.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fee can only be included when paid from the From account',
        path: ['feeIncludedInAmount'],
      });
    }

    if (v.feeIncludedInAmount && v.fee != null && v.fee > v.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fee cannot exceed Amount when included',
        path: ['fee'],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;
type RateMode = 'toPerFrom' | 'fromPerTo';

interface TransferFormRef {
  submitForm: () => Promise<void>;
}

export const TransferForm = forwardRef<TransferFormRef>((_, ref) => {
  const accounts = useAccountsWithDefaultOrder();
  const { submitForm, updateFormState, formState, closeForm } = useFormContext();
  const { create: createTransfer, update: updateTransfer, delete: deleteTransfer, isDeleting } = useMutations();

  const initialTransfer = formState.values instanceof Transfer ? (formState.values as Transfer) : null;
  const isEditMode = !!initialTransfer;

  const [rateMode, setRateMode] = useState<RateMode>('toPerFrom');
  const [rateText, setRateText] = useState('0');
  const [showFee, setShowFee] = useState(false);

  const defaultValues = {
    from: initialTransfer?.fromExpense.account.id,
    to: initialTransfer?.toIncome.account.id,
    amount: initialTransfer ? Math.abs(initialTransfer.fromExpense.amount) : 0,
    rate: initialTransfer?.rate ?? 0,
    fee: initialTransfer?.feeExpense ? Math.abs(initialTransfer.feeExpense.amount) : undefined,
    feeAccount: initialTransfer?.feeExpense?.account.id,
    executedAt: initialTransfer
      ? initialTransfer.executedAt.format(MOMENT_DATETIME_FORM_FORMAT)
      : moment().format(MOMENT_DATETIME_FORM_FORMAT),
    note: initialTransfer?.note || undefined,
    feeIncludedInAmount: false as boolean,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { control, setValue } = form;

  const watched = useWatch({
    control,
    name: ['from', 'to', 'amount', 'rate', 'fee', 'feeAccount', 'feeIncludedInAmount'],
  });

  const from = watched[0];
  const to = watched[1];
  const amount = Number.isFinite(watched[2] as number) ? (watched[2] as number) : 0;
  const rate = Number.isFinite(watched[3] as number) ? (watched[3] as number) : 0;
  const fee = watched[4];
  const feeAccount = watched[5];
  const feeIncluded = !!watched[6];

  const fromCurrency = useMemo(() => {
    if (!Number.isFinite(from as number)) return undefined;
    return accounts.find((a) => a.id === (from as number))?.currency;
  }, [from, accounts]);

  const toCurrency = useMemo(() => {
    if (!Number.isFinite(to as number)) return undefined;
    return accounts.find((a) => a.id === (to as number))?.currency;
  }, [to, accounts]);

  const summary = useMemo(() => {
    const feeNum = Number.isFinite(fee as number) ? (fee as number) : 0;
    const feeFrom = feeAccount != null && from != null && feeAccount === from;
    const netFrom = feeIncluded && feeFrom ? Math.max(amount - feeNum, 0) : amount;
    const netTo = netFrom * rate;
    const totalFrom = feeFrom ? (feeIncluded ? amount : amount + feeNum) : amount;
    return { feeNum, feeFrom, netFrom, netTo, totalFrom };
  }, [amount, rate, fee, feeAccount, feeIncluded, from]);

  const canIncludeFee = useMemo(() => {
    const feeNum = Number.isFinite(fee as number) ? (fee as number) : 0;
    return feeNum > 0 && feeAccount != null && from != null && feeAccount === from;
  }, [fee, feeAccount, from]);

  useEffect(() => {
    if (feeIncluded && !canIncludeFee) {
      setValue('feeIncludedInAmount', false, { shouldDirty: true, shouldValidate: true });
    }
  }, [feeIncluded, canIncludeFee, setValue]);

  useEffect(() => {
    const displayed = rateMode === 'toPerFrom' ? rate : rate > 0 ? 1 / rate : 0;
    setRateText(String(Number.isFinite(displayed) ? displayed : 0));
  }, [rateMode, rate]);

  // Show fee section if editing a transfer that has a fee
  useEffect(() => {
    if (isEditMode && initialTransfer?.feeExpense) setShowFee(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

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

  const { formRef } = useFormLogic({
    form,
    setFormState: updateFormState,
    onSubmit: async (values: FormValues) => {
      try {
        const feeNum = Number.isFinite(values.fee as number) ? (values.fee as number) : 0;
        const feeFrom = values.feeAccount != null && values.from != null && values.feeAccount === values.from;
        const payloadAmount =
          values.feeIncludedInAmount && feeFrom ? Math.max(values.amount - feeNum, 0) : values.amount;

        const payload = {
          from: values.from,
          to: values.to,
          amount: payloadAmount,
          rate: values.rate,
          fee: values.fee ?? undefined,
          feeAccount: values.feeAccount ?? undefined,
          executedAt: values.executedAt,
          note: values.note || '',
        };

        if (isEditMode) {
          await updateTransfer({ id: initialTransfer!.id, ...payload });
        } else {
          await createTransfer(payload);
        }

        submitForm(values);
      } catch (error: unknown) {
        toast.error('Failed to submit transfer. Please try again.', {
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

  const chipClass = (active: boolean) =>
    cn('h-6 px-2 rounded border font-mono text-2xs uppercase tracking-wider transition-colors cursor-pointer', {
      'bg-muted text-foreground border-border': active,
      'text-muted-foreground border-transparent hover:border-border': !active,
    });

  return (
    <Form {...form}>
      <form aria-label="Transfer form" className="flex flex-col gap-2">
        {/* Command bar */}
        <div className="flex items-center gap-1 px-1 py-0.5">
          <span className="h-6 px-2 rounded border font-mono text-2xs uppercase tracking-wider bg-muted text-foreground border-border flex items-center">
            transfer
          </span>

          <div className="mx-1 h-3.5 w-px bg-border" />

          <button type="button" className={chipClass(showFee)} onClick={() => setShowFee((s) => !s)}>
            fee
          </button>

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
                  value={field.value != null ? String(field.value) : null}
                  className={cn('h-7 text-xs w-full justify-between', { 'text-muted-foreground': !field.value })}
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
                  value={field.value != null ? String(field.value) : null}
                  className={cn('h-7 text-xs w-full justify-between', { 'text-muted-foreground': !field.value })}
                  onBlur={field.onBlur}
                  onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  ref={field.ref}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: Amount · Rate (with direction toggle prepend) · Receives */}
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
                      placeholder="Amount"
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

        {/* Fee row */}
        {showFee && (
          <div className="flex gap-2 items-center">
            <FormField
              control={control}
              name="fee"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0">
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        aria-label="Fee amount"
                        inputMode="decimal"
                        placeholder="Fee"
                        type="number"
                        className="h-7 text-xs pr-10"
                        onChange={(e) => {
                          const n = e.target.valueAsNumber;
                          field.onChange(Number.isFinite(n) ? n : undefined);
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

            <FormField
              control={control}
              name="feeAccount"
              render={({ field }) => (
                <FormItem className="flex-[2] min-w-0">
                  <AccountTypeahead
                    aria-label="Fee account"
                    disabled={field.disabled}
                    multiple={false}
                    name={field.name}
                    value={field.value != null ? String(field.value) : null}
                    className={cn('h-7 text-xs w-full justify-between', { 'text-muted-foreground': !field.value })}
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
              name="feeIncludedInAmount"
              render={({ field }) => (
                <button
                  disabled={!canIncludeFee}
                  type="button"
                  className={cn(
                    'h-7 px-2 rounded border font-mono text-2xs uppercase tracking-wider transition-colors shrink-0',
                    {
                      'bg-muted text-foreground border-border': field.value,
                      'text-muted-foreground border-transparent hover:border-border': !field.value && canIncludeFee,
                      'opacity-40 cursor-not-allowed border-transparent': !canIncludeFee,
                    },
                  )}
                  onClick={() => field.onChange(!field.value)}
                >
                  incl
                </button>
              )}
            />
          </div>
        )}

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
