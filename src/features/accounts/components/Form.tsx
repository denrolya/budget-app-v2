import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CreditCard, MoreHorizontal, Wallet } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ACCOUNT_CURRENCY_COLORSCHEME } from '@/constants/colors';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useForm as useFormContext } from '@/contexts/Form';
import { useMutations } from '@/features/accounts/api/mutations';
import { useFormLogic } from '@/hooks/useFormLogic';

import { Type as AccountType, CreateAccountDTO, UpdateAccountDTO } from '../types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  currency: z.nativeEnum(CURRENCY_CODE),
  balance: z.number().min(0, { message: 'Initial balance must be a positive number.' }),
  type: z.nativeEnum(AccountType),
  cardNumber: z.string().optional(),
  iban: z.string().optional(),
  bankName: z.string().optional(),
  providerName: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export interface AccountFormRef {
  submitForm: () => Promise<void>;
}

interface AccountFormProps {
  key: string;
}

type CurrencyCard = {
  code: CURRENCY_CODE;
  symbol: string;
  colorVar: string;
};

const CURRENCY_CARDS: Record<CURRENCY_CODE, CurrencyCard> = {
  [CURRENCY_CODE.EUR]: { code: CURRENCY_CODE.EUR, symbol: CURRENCIES.EUR.symbol, colorVar: 'var(--account-bank-EUR)' },
  [CURRENCY_CODE.USD]: { code: CURRENCY_CODE.USD, symbol: CURRENCIES.USD.symbol, colorVar: 'var(--account-bank-USD)' },
  [CURRENCY_CODE.UAH]: { code: CURRENCY_CODE.UAH, symbol: CURRENCIES.UAH.symbol, colorVar: 'var(--account-bank-UAH)' },
  [CURRENCY_CODE.HUF]: { code: CURRENCY_CODE.HUF, symbol: CURRENCIES.HUF.symbol, colorVar: 'var(--account-bank-HUF)' },
  [CURRENCY_CODE.BTC]: { code: CURRENCY_CODE.BTC, symbol: CURRENCIES.BTC.symbol, colorVar: 'var(--account-bank-BTC)' },
  [CURRENCY_CODE.ETH]: { code: CURRENCY_CODE.ETH, symbol: CURRENCIES.ETH.symbol, colorVar: 'var(--account-bank-ETH)' },
};

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
    formState: { values: data },
  } = useFormContext();

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
      providerName: data?.providerName || '',
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
          await update({
            id: data.id as number,
            diff: values as UpdateAccountDTO,
          });
        } else {
          await create(values as unknown as CreateAccountDTO);
        }
      } catch (error) {
        console.error('Account form submission failed:', error);
        toast.error('Failed to submit account. Issue requires investigation.');
      }
    },
  });

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await formRef.current?.submitForm();
    },
  }));

  const getButtonStyle = (value: string, field: 'currency' | 'type') => {
    const baseStyle = 'h-20 sm:h-24 transition-colors duration-200';
    const isSelected = form.watch(field) === value;

    const currency = form.watch('currency');
    const bgColor =
      field === 'type'
        ? ACCOUNT_CURRENCY_COLORSCHEME[value as keyof typeof ACCOUNT_CURRENCY_COLORSCHEME][
            currency as keyof (typeof ACCOUNT_CURRENCY_COLORSCHEME)[AccountType.Internet]
          ]
        : CURRENCY_CARDS[value as CURRENCY_CODE].colorVar;

    const textColor = isSelected ? 'text-primary-foreground' : 'text-primary';
    return `${baseStyle} ${isSelected ? `bg-[${bgColor}]` : 'bg-background'} ${textColor}`;
  };

  const currencyOptions = useMemo(
    () => [CURRENCY_CODE.EUR, CURRENCY_CODE.USD, CURRENCY_CODE.UAH, CURRENCY_CODE.HUF, CURRENCY_CODE.BTC] as const,
    [],
  );

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <div className="grid grid-cols-5 gap-4">
                  {currencyOptions.map((code) => {
                    const info = CURRENCY_CARDS[code];
                    return (
                      <Button
                        type="button"
                        variant={field.value === code ? 'default' : 'outline'}
                        style={{
                          backgroundColor: field.value === code ? info.colorVar : undefined,
                        }}
                        className={cn(
                          'flex-1 h-14 text-sm font-medium border-2 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground',
                          {
                            'bg-primary/10': field.value === code,
                            'border-transparent': field.value !== code,
                          },
                        )}
                        key={code}
                        onClick={() => field.onChange(code)}
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <span className="text-lg">{info.symbol}</span>
                          <span className="text-xs">{code}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { value: AccountType.Cash, label: 'Cash', icon: Banknote },
                    { value: AccountType.Bank, label: 'Bank', icon: Wallet },
                    { value: AccountType.Internet, label: 'Internet', icon: CreditCard },
                    { value: AccountType.Basic, label: 'Basic', icon: MoreHorizontal },
                  ].map((option) => (
                    <Button
                      type="button"
                      variant={field.value === option.value ? 'default' : 'outline'}
                      style={{
                        backgroundColor:
                          field.value === option.value
                            ? ACCOUNT_CURRENCY_COLORSCHEME[option.value as keyof typeof ACCOUNT_CURRENCY_COLORSCHEME][
                                form.watch(
                                  'currency',
                                ) as keyof (typeof ACCOUNT_CURRENCY_COLORSCHEME)[AccountType.Internet]
                              ]
                            : undefined,
                      }}
                      className={getButtonStyle(option.value, 'type')}
                      key={option.value}
                      onClick={() => field.onChange(option.value)}
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <option.icon className="w-6 h-6" />
                        <span>{option.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter account name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Balance</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter initial balance"
                  type="number"
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('type') === AccountType.Bank && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bank name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter card number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter IBAN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {form.watch('type') === AccountType.Internet && (
          <FormField
            control={form.control}
            name="providerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter provider name (e.g., Wise, PayPal)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  );
});

export default AccountForm;
