import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useForm as useFormContext } from '@/contexts/Form';
import { useMutations } from '@/features/accounts/api/mutations';
import { useFormLogic } from '@/hooks/useFormLogic';
import { cn } from '@/lib/utils';

import { Type as AccountType, type CreateAccountDTO, type UpdateAccountDTO } from '../types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  currency: z.nativeEnum(CURRENCY_CODE),
  balance: z.number().min(0, { message: 'Initial balance must be a positive number.' }),
  type: z.nativeEnum(AccountType),
  cardNumber: z.string().optional(),
  iban: z.string().optional(),
  bankName: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export interface AccountFormRef {
  submitForm: () => Promise<void>;
}

interface AccountFormProps {
  key: string;
}

const ACCOUNT_TYPE_CYCLE: AccountType[] = [AccountType.Bank, AccountType.Cash, AccountType.Internet, AccountType.Basic];

const CURRENCY_CHIPS = [
  CURRENCY_CODE.EUR,
  CURRENCY_CODE.USD,
  CURRENCY_CODE.UAH,
  CURRENCY_CODE.HUF,
  CURRENCY_CODE.BTC,
] as const;

const normalizeCurrency = (v: unknown): CURRENCY_CODE => {
  const raw = String(v ?? '')
    .trim()
    .toUpperCase();
  return (Object.values(CURRENCY_CODE) as string[]).includes(raw) ? (raw as CURRENCY_CODE) : CURRENCY_CODE.EUR;
};

const normalizeType = (v: unknown): FormSchema['type'] => {
  const raw = String(v ?? '')
    .trim()
    .toLowerCase();
  if (raw === AccountType.Bank || raw === AccountType.Cash || raw === AccountType.Internet) return raw;
  return AccountType.Basic;
};

export const AccountForm = forwardRef<AccountFormRef, AccountFormProps>((_, ref) => {
  const { create, update } = useMutations();
  const {
    updateFormState,
    formState: { values: rawData },
  } = useFormContext();
  const data = rawData as (Partial<FormSchema> & { id?: number }) | null | undefined;

  const defaultValues: FormSchema = useMemo(
    () => ({
      ...data,
      name: data?.name || '',
      currency: normalizeCurrency(data?.currency),
      balance: typeof data?.balance === 'number' ? data.balance : 0,
      type: normalizeType(data?.type),
      cardNumber: data?.cardNumber || '',
      iban: data?.iban || '',
      bankName: data?.bankName || '',
    }),
    [data],
  );

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { formRef } = useFormLogic({
    form,
    setFormState: updateFormState,
    onSubmit: async (values: FormSchema) => {
      try {
        if (data?.id) {
          await update({ id: data.id as number, diff: values as UpdateAccountDTO });
        } else {
          await create(values as unknown as CreateAccountDTO);
        }
      } catch {
        toast.error('Failed to submit account. Issue requires investigation.');
      }
    },
  });

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await formRef.current?.submitForm();
    },
  }));

  const watchedType = form.watch('type');
  const watchedCurrency = form.watch('currency');

  const chipClass = (active: boolean) =>
    cn('h-6 px-2 rounded border font-mono text-2xs uppercase tracking-wider transition-colors cursor-pointer', {
      'bg-muted text-foreground border-border': active,
      'text-muted-foreground border-transparent hover:border-border': !active,
    });

  return (
    <Form {...form}>
      <form aria-label="Account form" className="flex flex-col gap-2">
        {/* Command bar */}
        <div className="flex items-center gap-1 px-1 py-0.5">
          {/* Type chip — click to cycle */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => {
              const cycleType = () => {
                const idx = ACCOUNT_TYPE_CYCLE.indexOf(field.value);
                field.onChange(ACCOUNT_TYPE_CYCLE[(idx + 1) % ACCOUNT_TYPE_CYCLE.length]);
              };
              return (
                <button type="button" className={chipClass(true)} onClick={cycleType}>
                  {field.value}
                </button>
              );
            }}
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

        {/* Row 1: Name · Balance */}
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-[2] min-w-0">
                <FormControl>
                  <Input {...field} placeholder="Account name" className="h-7 text-xs" />
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

        {/* Bank fields */}
        {watchedType === AccountType.Bank && (
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0">
                  <FormControl>
                    <Input {...field} placeholder="Bank name" className="h-7 text-xs" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0">
                  <FormControl>
                    <Input {...field} placeholder="Card ····" className="h-7 text-xs font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0">
                  <FormControl>
                    <Input {...field} placeholder="IBAN" className="h-7 text-xs font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

      </form>
    </Form>
  );
});

AccountForm.displayName = 'AccountForm';

export default AccountForm;
