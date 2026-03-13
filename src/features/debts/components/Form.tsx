import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useForm as useFormContext } from '@/contexts/Form';
import { useMutations } from '@/features/debts/api/mutations';
import { useFormLogic } from '@/hooks/useFormLogic';

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
    formState: { values: data },
  } = useFormContext();

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

  return (
    <Form {...form}>
      <form aria-label="Debt form" className="flex flex-col gap-6">
        {/* Row 1: Currency + Debtor */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as CURRENCY_CODE)}>
                    <FormControl>
                      <SelectTrigger aria-label="Currency" className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {(Object.values(CURRENCY_CODE) as CURRENCY_CODE[]).map((code) => (
                        <SelectItem value={code} key={code}>
                          <span className="inline-flex items-center gap-2">
                            <span aria-hidden="true">{CURRENCIES[code]?.symbol ?? ''}</span>
                            <span>{code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex-[2] min-w-0">
            <FormField
              control={form.control}
              name="debtor"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Debtor</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      aria-label="Debtor"
                      autoComplete="name"
                      placeholder="Enter debtor name"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Row 2: Balance + ClosedAt */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Balance</FormLabel>
                  <FormControl>
                    <Input
                      aria-label="Balance"
                      inputMode="decimal"
                      type="number"
                      value={Number.isFinite(field.value) ? field.value : 0}
                      className="w-full"
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <FormField
              control={form.control}
              name="closedAt"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Closed At</FormLabel>
                  <FormControl>
                    <Input
                      aria-label="Closed at"
                      type="datetime-local"
                      value={field.value ?? ''}
                      className="w-full"
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Row 3: Note (taller) */}
        <div className="flex flex-col">
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    aria-label="Note"
                    placeholder="Add a note..."
                    className="min-h-[9rem] resize-y w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
});

DebtForm.displayName = 'DebtForm';

export default DebtForm;
