import { zodResolver } from '@hookform/resolvers/zod';
import cn from 'classnames';
import { ArrowLeftRight } from 'lucide-react';
import moment from 'moment';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import AccountTypeahead from '@/components/common/AccountTypeahead';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';
import { useFinanceData } from '@/contexts/FinanceData';
import { useForm as useFormContext } from '@/contexts/Form';
import { useFormLogic } from '@/hooks/useFormLogic';
import { api } from '@/services/api';

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
  const finance = useFinanceData();
  const { refetchAccounts } = finance;
  const { submitForm, updateFormState } = useFormContext();

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

  // Currency lookup (defensive)
  const accounts: any[] | undefined = (finance as any).accounts ?? (finance as any).data?.accounts ?? [];

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

  useMemo(() => {
    if (feeIncluded && !canIncludeFee) {
      setValue('feeIncludedInAmount', false, { shouldDirty: true, shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canIncludeFee]);

  // Sync rate text with canonical + view mode (don’t fight user while typing; normalize on blur)
  useMemo(() => {
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

    // Smart interpretation
    if (rateMode === 'toPerFrom') {
      if (n < 1) {
        setRateMode('fromPerTo');
        setValue('rate', 1 / n, { shouldDirty: true, shouldValidate: true });
        setRateText(String(n));
        return;
      }
      setValue('rate', n, { shouldDirty: true, shouldValidate: true });
      return;
    }

    // fromPerTo
    if (n > 1) {
      setRateMode('toPerFrom');
      setValue('rate', n, { shouldDirty: true, shouldValidate: true });
      setRateText(String(n));
      return;
    }

    setValue('rate', 1 / n, { shouldDirty: true, shouldValidate: true });
  };

  const { formRef } = useFormLogic({
    form,
    setFormState: updateFormState,
    onSubmit: async (values: FormValues) => {
      try {
        const feeNum = Number.isFinite(values.fee as number) ? (values.fee as number) : 0;
        const feeFrom = values.feeAccount != null && values.from != null && values.feeAccount === values.from;
        const payloadAmount = values.feeIncludedInAmount && feeFrom ? Math.max(values.amount - feeNum, 0) : values.amount;

        const formattedData = {
          from: values.from,
          to: values.to,
          amount: payloadAmount.toString(),
          rate: values.rate.toString(), // canonical TO per 1 FROM
          fee: values.fee != null ? values.fee.toString() : undefined,
          feeAccount: values.feeAccount,
          executedAt: moment(values.executedAt).toISOString(),
          note: values.note || '',
        };

        const response = await api.post('/api/transfers', formattedData);
        logger.info(response, 'Transfer Create');

        await refetchAccounts();
        submitForm(values);
      } catch (error) {

        console.error('Form submission failed:', error);
        toast.error('Failed to submit transfer. Please try again.');
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
            name="from"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">From</FormLabel>
                <AccountTypeahead
                  {...field}
                  multiple={false}
                  aria-label="From account"
                  className={cn('w-full justify-between', { 'text-muted-foreground': !field.value })}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="to"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">To</FormLabel>
                <AccountTypeahead
                  {...field}
                  multiple={false}
                  aria-label="To account"
                  className={cn('w-full justify-between', { 'text-muted-foreground': !field.value })}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Amount + Rate row (narrow modal friendly) */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            name="amount"
            control={control}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-baseline justify-between gap-2">
                  <FormLabel className="text-sm">You Send</FormLabel>
                  {fromCurrency ? <span className="text-2xs text-muted-foreground">{fromCurrency}</span> : null}
                </div>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="decimal"
                    aria-label="Amount you send"
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
              <span className="text-2xs text-muted-foreground whitespace-nowrap" aria-hidden="true">
                {pairLabel}
              </span>
            </div>

            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={rateText}
                onChange={(e) => setRateText(e.target.value)}
                onBlur={normalizeRateOnBlur}
                aria-label="Exchange rate"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                aria-label="Toggle rate view"
                aria-pressed={rateMode === 'fromPerTo'}
                onClick={() => setRateMode((m) => (m === 'toPerFrom' ? 'fromPerTo' : 'toPerFrom'))}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>
          </FormItem>
        </div>

        {/* Fee (aligned) */}
        <div className="rounded-md border p-2 space-y-2" aria-label="Fee">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <FormField
              name="fee"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-baseline justify-between gap-2">
                    <FormLabel className="text-sm">Fee</FormLabel>
                    {fromCurrency ? <span className="text-2xs text-muted-foreground">{fromCurrency}</span> : null}
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      inputMode="decimal"
                      aria-label="Fee amount"
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
              name="feeAccount"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Fee Account</FormLabel>
                  <AccountTypeahead
                    {...field}
                    multiple={false}
                    aria-label="Account that pays the fee"
                    className={cn('w-full justify-between', { 'text-muted-foreground': !field.value })}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className={cn('text-sm', { 'text-muted-foreground': !canIncludeFee })}>
              Include fee in amount
            </Label>

            <FormField
              name="feeIncludedInAmount"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v)}
                  disabled={!canIncludeFee}
                  aria-label="Toggle fee included in amount"
                  aria-describedby={feeHint ? 'transfer-fee-hint' : undefined}
                />
              )}
            />
          </div>

          {feeHint ? (
            <p id="transfer-fee-hint" className="text-2xs text-muted-foreground" aria-live="polite">
              {feeHint}
            </p>
          ) : null}
        </div>

        {/* They Receive full width (no truncation, no tab stop) */}
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
          name="executedAt"
          control={control}
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
          name="note"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Note</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Add a note..." aria-label="Note" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
});

export default TransferForm;
