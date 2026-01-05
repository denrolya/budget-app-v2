import { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Banknote, CreditCard, MoreHorizontal, Wallet } from 'lucide-react';
import cn from 'classnames';

import { defaultOnSubmit, useFormLogic } from '@/hooks/useFormLogic';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm as useFormContext } from '@/contexts/Form';
import { ACCOUNT_CURRENCY_COLORSCHEME } from '@/constants/colors';

const currencyInfo = {
  eur: { symbol: '€', color: 'var(--account-bank-EUR)', name: 'Euro' },
  usd: { symbol: '$', color: 'var(--account-bank-USD)', name: 'US Dollar' },
  uah: { symbol: '₴', color: 'var(--account-bank-UAH)', name: 'Ukrainian Hryvnia' },
  huf: { symbol: 'Ft', color: 'var(--account-bank-HUF)', name: 'Hungarian Forint' },
  btc: { symbol: '₿', color: 'var(--account-bank-BTC)', name: 'Bitcoin' },
};

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  currency: z.enum(['eur', 'usd', 'uah', 'huf', 'btc']),
  balance: z.number().min(0, { message: 'Initial balance must be a positive number.' }),
  type: z.enum(['internet', 'bank', 'cash', 'other']),
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

export const AccountForm = forwardRef<AccountFormRef, AccountFormProps>((_, ref) => {
  const {
    updateFormState,
    formState: { values: data },
  } = useFormContext();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      currency: data?.currency || 'eur',
      balance: data?.balance || 0,
      type: data?.type || 'cash',
      cardNumber: data?.cardNumber || '',
      iban: data?.iban || '',
      bankName: data?.bankName || '',
      providerName: data?.providerName || '',
    },
  });

  const { formRef } = useFormLogic({
    form,
    setFormState: updateFormState,
    onSubmit: defaultOnSubmit,
  });

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await formRef.current?.submitForm();
    },
  }));

  const getButtonStyle = (value: string, field: 'currency' | 'type') => {
    const baseStyle = 'h-20 sm:h-24 transition-colors duration-200';
    const isSelected = form.watch(field) === value;
    const bgColor =
      field === 'type'
        ? ACCOUNT_CURRENCY_COLORSCHEME[value as keyof typeof ACCOUNT_CURRENCY_COLORSCHEME][
            form.watch('currency') as keyof (typeof ACCOUNT_CURRENCY_COLORSCHEME)['internet']
          ]
        : currencyInfo[value as keyof typeof currencyInfo].color;
    const textColor = isSelected ? 'text-primary-foreground' : 'text-primary';
    return `${baseStyle} ${isSelected ? `bg-[${bgColor}]` : 'bg-background'} ${textColor}`;
  };

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
                  {Object.entries(currencyInfo).map(([value, info]) => (
                    <Button
                      type="button"
                      variant={field.value === value ? 'default' : 'outline'}
                      style={{
                        backgroundColor: field.value === value ? info.color : undefined,
                      }}
                      className={cn(
                        'flex-1 h-14 text-sm font-medium border-2 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground',
                        {
                          'bg-primary/10': field.value === value,
                          'border-transparent': field.value !== value,
                        },
                      )}
                      key={value}
                      onClick={() => field.onChange(value)}
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <span className="text-lg">{info.symbol}</span>
                        <span className="text-xs">{value.toUpperCase()}</span>
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { value: 'cash', label: 'Cash', icon: Banknote },
                    { value: 'bank', label: 'Bank', icon: Wallet },
                    { value: 'internet', label: 'Internet', icon: CreditCard },
                    { value: 'other', label: 'Other', icon: MoreHorizontal },
                  ].map((option) => (
                    <Button
                      type="button"
                      variant={field.value === option.value ? 'default' : 'outline'}
                      style={{
                        backgroundColor:
                          field.value === option.value
                            ? ACCOUNT_CURRENCY_COLORSCHEME[option.value as keyof typeof ACCOUNT_CURRENCY_COLORSCHEME][
                                form.watch('currency') as keyof (typeof ACCOUNT_CURRENCY_COLORSCHEME)['internet']
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
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch('type') === 'bank' && (
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
        {form.watch('type') === 'internet' && (
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
