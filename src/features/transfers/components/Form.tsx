import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import moment from 'moment';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';
import { useForm as useFormContext } from '@/contexts/Form';
import { AccountTypeahead } from '@/features/accounts';
import { useAccountsWithDefaultOrder } from '@/hooks/financeData';
import { useFormLogic } from '@/hooks/useFormLogic';

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

    // UI-only
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
  const { submitForm, updateFormState } = useFormContext();
  const { create: createTransfer, isCreating } = useMutations();

  const [rateMode, setRateMode] = useState<RateMode>('toPerFrom');
  const [rateText, setRateText] = useState('0');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: undefined,
      to: undefined,
      amount: 0,
      rate: 0,
      fee: undefined,
      feeAccount: undefined,
      executedAt: moment().format(MOMENT_DATETIME_FORM_FORMAT),
      note: undefined,
      feeIncludedInAmount: false,
    },
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
    const grossTo = amount * rate;
    const netTo = netFrom * rate;

    const totalFrom = feeFrom ? (feeIncluded ? amount : amount + feeNum) : amount;

    return { feeNum, feeFrom, netFrom, grossTo, netTo, totalFrom };
  }, [amount, rate, fee, feeAccount, feeIncluded, from]);

  const canIncludeFee = useMemo(() => {
    const feeNum = Number.isFinite(fee as number) ? (fee as number) : 0;
    return feeNum > 0 && feeAccount != null && from != null && feeAccount === from;
  }, [fee, feeAccount, from]);

  // If fee inclusion becomes invalid, force it off (side-effect => useEffect)
  useEffect(() => {
    if (feeIncluded && !canIncludeFee) {
      setValue('feeIncludedInAmount', false, { shouldDirty: true, shouldValidate: true });
    }
  }, [feeIncluded, canIncludeFee, setValue]);

  // Sync rateText with canonical rate + view mode (side-effect => useEffect)
  useEffect(() => {
    const displayed = rateMode === 'toPerFrom' ? rate : rate > 0 ? 1 / rate : 0;
    setRateText(String(Number.isFinite(displayed) ? displayed : 0));
  }, [rateMode, rate]);

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
      return;
    }

    // fromPerTo отображает 1/rate
    setValue('rate', 1 / n, { shouldDirty: true, shouldValidate: true });
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

        await createTransfer({
          from: values.from,
          to: values.to,
          amount: payloadAmount,
          rate: values.rate,
          fee: values.fee ?? undefined,
          feeAccount: values.feeAccount ?? undefined,
          executedAt: values.executedAt,
          note: values.note || '',
        });

        submitForm(values);
      } catch (error: any) {
        // mutation already toasts; keep this minimal
        toast.error('Failed to submit transfer. Please try again.', {
          description: error?.message || undefined,
        });
        throw error;
      }
    },
  });

  useImperativeHandle(ref, () => formRef.current!);

  const pairLabel =
    fromCurrency && toCurrency
      ? rateMode === 'toPerFrom'
        ? `${toCurrency} / ${fromCurrency}`
        : `${fromCurrency} / ${toCurrency}`
      : rateMode === 'toPerFrom'
        ? 'TO / FROM'
        : 'FROM / TO';

  const receiveHint = useMemo(() => {
    const grossTo = Number.isFinite(summary.grossTo) ? summary.grossTo.toFixed(2) : '0.00';
    const netFrom = Number.isFinite(summary.netFrom) ? summary.netFrom.toFixed(2) : '0.00';
    const totalFrom = Number.isFinite(summary.totalFrom) ? summary.totalFrom.toFixed(2) : '0.00';

    return `Gross: ${grossTo}${toCurrency ? ` ${toCurrency}` : ''} · Net(from): ${netFrom}${
      fromCurrency ? ` ${fromCurrency}` : ''
    } · Total(from): ${totalFrom}${fromCurrency ? ` ${fromCurrency}` : ''}`;
  }, [summary.grossTo, summary.netFrom, summary.totalFrom, fromCurrency, toCurrency]);

  const feeHint = useMemo(() => {
    const feeNum = Number.isFinite(fee as number) ? (fee as number) : 0;
    if (feeNum <= 0) return null;

    if (feeAccount == null) return 'Fee account not selected (treated as separate).';
    if (from != null && feeAccount === from) {
      return feeIncluded ? 'Included: net transfer = amount − fee.' : 'Added: total cost = amount + fee.';
    }
    return 'Fee paid separately (not from From account).';
  }, [fee, feeAccount, from, feeIncluded]);

  const receiveValue =
    Number.isFinite(summary.netTo) && summary.netTo >= 0
      ? `${summary.netTo.toFixed(2)}${toCurrency ? ` ${toCurrency}` : ''}`
      : `0.00${toCurrency ? ` ${toCurrency}` : ''}`;

  return (
    <Form {...form}>
      <form className="space-y-2">
        {/* Accounts */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <FormField
            control={control}
            name="from"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">From</FormLabel>
                <AccountTypeahead
                  aria-label="From account"
                  disabled={field.disabled}
                  multiple={false}
                  name={field.name}
                  value={field.value != null ? String(field.value) : null}
                  className={cn('w-full justify-between', { 'text-muted-foreground': !field.value })}
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
                <FormLabel className="text-sm">To</FormLabel>
                <AccountTypeahead
                  aria-label="To account"
                  disabled={field.disabled}
                  multiple={false}
                  name={field.name}
                  value={field.value != null ? String(field.value) : null}
                  className={cn('w-full justify-between', { 'text-muted-foreground': !field.value })}
                  onBlur={field.onBlur}
                  onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  ref={field.ref}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Amount + Rate */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-baseline justify-between gap-2">
                  <FormLabel className="text-sm">You Send</FormLabel>
                  {fromCurrency ? <span className="text-2xs text-muted-foreground">{fromCurrency}</span> : null}
                </div>
                <FormControl>
                  <Input
                    {...field}
                    aria-label="Amount you send"
                    inputMode="decimal"
                    type="number"
                    onChange={(e) => {
                      const n = e.target.valueAsNumber;
                      field.onChange(Number.isFinite(n) ? n : 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <div className="flex items-baseline justify-between gap-2">
              <FormLabel className="text-sm">Rate</FormLabel>
              <span aria-hidden="true" className="text-2xs text-muted-foreground whitespace-nowrap">
                {pairLabel}
              </span>
            </div>

            <div className="relative">
              <Input
                aria-label="Exchange rate"
                inputMode="decimal"
                type="text"
                value={rateText}
                className="pr-10"
                onBlur={normalizeRateOnBlur}
                onChange={(e) => setRateText(e.target.value)}
              />
              <Button
                aria-label="Toggle rate view"
                aria-pressed={rateMode === 'fromPerTo'}
                size="icon"
                type="button"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setRateMode((m) => (m === 'toPerFrom' ? 'fromPerTo' : 'toPerFrom'))}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>
          </FormItem>
        </div>

        {/* Fee */}
        <div aria-label="Fee" className="rounded-md border p-2 space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <FormField
              control={control}
              name="fee"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-baseline justify-between gap-2">
                    <FormLabel className="text-sm">Fee</FormLabel>
                    {fromCurrency ? <span className="text-2xs text-muted-foreground">{fromCurrency}</span> : null}
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      aria-label="Fee amount"
                      inputMode="decimal"
                      type="number"
                      onChange={(e) => {
                        const n = e.target.valueAsNumber;
                        field.onChange(Number.isFinite(n) ? n : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="feeAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Fee Account</FormLabel>
                  <AccountTypeahead
                    aria-label="Account that pays the fee"
                    disabled={field.disabled}
                    multiple={false}
                    name={field.name}
                    value={field.value != null ? String(field.value) : null}
                    className={cn('w-full justify-between', { 'text-muted-foreground': !field.value })}
                    onBlur={field.onBlur}
                    onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    ref={field.ref}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className={cn('text-sm', { 'text-muted-foreground': !canIncludeFee })}>Include fee in amount</Label>

            <FormField
              control={control}
              name="feeIncludedInAmount"
              render={({ field }) => (
                <Switch
                  aria-describedby={feeHint ? 'transfer-fee-hint' : undefined}
                  aria-label="Toggle fee included in amount"
                  checked={field.value}
                  disabled={!canIncludeFee}
                  onCheckedChange={(v) => field.onChange(v)}
                />
              )}
            />
          </div>

          {feeHint ? (
            <p aria-live="polite" id="transfer-fee-hint" className="text-2xs text-muted-foreground">
              {feeHint}
            </p>
          ) : null}
        </div>

        {/* They Receive */}
        <div className="rounded-md border p-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label className="text-sm">They Receive</Label>
            {toCurrency ? <span className="text-2xs text-muted-foreground">{toCurrency}</span> : null}
          </div>

          <div className="mt-1 h-10 w-full rounded-md border bg-muted/40 px-3 py-2 text-sm tabular-nums flex items-center">
            {receiveValue}
          </div>

          <p className="mt-1 text-2xs text-muted-foreground">{receiveHint}</p>
        </div>

        {/* Meta */}
        <FormField
          control={control}
          name="executedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Executed At</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} aria-label="Execution date and time" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Note</FormLabel>
              <FormControl>
                <Input {...field} aria-label="Note" placeholder="Add a note..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional submit button if you ever render this standalone */}
        <div className="pt-2">
          <Button
            disabled={isCreating}
            type="button"
            className="w-full"
            onClick={() => formRef.current?.submitForm?.()}
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Submitting…
              </span>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
});

TransferForm.displayName = 'TransferForm';
export default TransferForm;
