import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useForm as useFormContext } from '@/contexts/Form';
import { useMutations } from '@/features/debts/api/mutations';
import { useFormLogic } from '@/hooks/useFormLogic';
import { cn } from '@/lib/utils';

const schema = z.object({
  debtor: z.string().min(2, { message: 'Debtor must be at least 2 characters.' }),
  currency: z.nativeEnum(CURRENCY_CODE),
  balance: z.number().min(0, { message: 'Balance must be a non-negative number.' }).default(0),
  note: z.string().optional(),
  closedAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export interface DebtFormRef {
  submitForm: () => Promise<void>;
}

interface DebtFormProps {
  key: string;
}

const CURRENCY_CHIPS = [CURRENCY_CODE.EUR, CURRENCY_CODE.USD, CURRENCY_CODE.UAH] as const;

const toDatetimeLocal = (v: unknown): string => {
  if (!v) return '';
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? s : s.includes('T') ? s.slice(0, 16) : '';
};

const toNumber = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeCurrency = (v: unknown): CURRENCY_CODE => {
  const raw = String(v ?? '')
    .trim()
    .toUpperCase();
  return (Object.values(CURRENCY_CODE) as string[]).includes(raw) ? (raw as CURRENCY_CODE) : CURRENCY_CODE.EUR;
};

export const DebtForm = forwardRef<DebtFormRef, DebtFormProps>((_, ref) => {
  const { create, update } = useMutations();
  const {
    updateFormState,
    formState: { values: rawData },
  } = useFormContext();
  const data = rawData as (Partial<FormValues> & { id?: number }) | null | undefined;

  const defaultValues = useMemo<FormValues>(
    () => ({
      ...data,
      debtor: data?.debtor ?? '',
      currency: normalizeCurrency(data?.currency),
      balance: toNumber(data?.balance),
      note: data?.note ?? '',
      closedAt: toDatetimeLocal(data?.closedAt),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the edited record changes, not on every field update
    [data?.id],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the record id changes; including form/defaultValues would cause infinite resets
  }, [data?.id]);

  const { formRef } = useFormLogic({
    form,
    setFormState: updateFormState,
    onSubmit: async (values) => {
      const payload = {
        debtor: values.debtor.trim(),
        currency: values.currency,
        balance: String(values.balance ?? 0),
        note: values.note?.trim() ? values.note.trim() : null,
        closedAt: values.closedAt?.trim() ? values.closedAt : null,
      };

      try {
        if (data?.id) {
          await update({ id: data.id as number, payload });
        } else {
          await create(payload);
        }
      } catch {
        toast.error('Failed to submit debt');
      }
    },
  });

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await formRef.current?.submitForm();
    },
  }));

  const watchedCurrency = form.watch('currency');
  const watchedClosedAt = form.watch('closedAt');
  const isClosed = !!watchedClosedAt?.trim();

  const chipClass = (active: boolean) =>
    cn('h-6 px-2 rounded border font-mono text-2xs uppercase tracking-wider transition-colors cursor-pointer', {
      'bg-muted text-foreground border-border': active,
      'text-muted-foreground border-transparent hover:border-border': !active,
    });

  return (
    <Form {...form}>
      <form aria-label="Debt form" className="flex flex-col gap-2">
        {/* Command bar */}
        <div className="flex items-center gap-1 px-1 py-0.5">
          {/* Open / Closed status chip */}
          <FormField
            control={form.control}
            name="closedAt"
            render={({ field }) => (
              <>
                <button
                  type="button"
                  className={chipClass(!isClosed)}
                  onClick={() => field.onChange('')}
                >
                  open
                </button>
                <button
                  type="button"
                  className={chipClass(isClosed)}
                  onClick={() => {
                    if (!isClosed) {
                      const now = new Date();
                      const pad = (n: number) => String(n).padStart(2, '0');
                      const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                      field.onChange(local);
                    }
                  }}
                >
                  closed
                </button>
              </>
            )}
          />

          <div className="mx-1 h-3.5 w-px bg-border" />

          {/* Currency chips */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <div className="flex items-center gap-1">
                {CURRENCY_CHIPS.map((code) => (
                  <button
                    type="button"
                    className={chipClass(watchedCurrency === code)}
                    key={code}
                    onClick={() => field.onChange(code)}
                  >
                    {CURRENCIES[code]?.symbol ?? code}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {/* Row 1: Debtor · Balance */}
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="debtor"
            render={({ field }) => (
              <FormItem className="flex-[2] min-w-0">
                <FormControl>
                  <Input
                    {...field}
                    aria-label="Debtor"
                    autoComplete="name"
                    placeholder="Debtor"
                    className="h-7 text-xs"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0">
                <FormControl>
                  <Input
                    aria-label="Balance"
                    inputMode="decimal"
                    placeholder="Balance"
                    type="number"
                    value={Number.isFinite(field.value) ? field.value : 0}
                    className="h-7 text-xs"
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: Note · Closed At (conditional) */}
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0">
                <FormControl>
                  <Input
                    {...field}
                    aria-label="Note"
                    placeholder="Note…"
                    className="h-7 text-xs"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isClosed && (
            <FormField
              control={form.control}
              name="closedAt"
              render={({ field }) => (
                <FormItem className="w-44 shrink-0">
                  <FormControl>
                    <Input
                      aria-label="Closed at"
                      type="datetime-local"
                      value={field.value ?? ''}
                      className="h-7 text-xs"
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </form>
    </Form>
  );
});

DebtForm.displayName = 'DebtForm';

export default DebtForm;
