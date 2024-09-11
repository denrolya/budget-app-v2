import { defaultOnSubmit, useFormLogic } from '@/hooks/form.tsx';
import { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Banknote, CreditCard, MoreHorizontal, Wallet } from 'lucide-react';
import cn from 'classnames';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const colorScheme = {
  bank: {
    eur: '#33CCFF',
    usd: '#66FF66',
    uah: '#FFDD55',
    huf: '#FF6347',
    btc: '#9932CC',
  },
  cash: {
    eur: '#0099CC',
    usd: '#32CD32',
    uah: '#FFD100',
    huf: '#B22222',
    btc: '#4B0082',
  },
  internet: {
    eur: '#006080',
    usd: '#228B22',
    uah: '#CCAC00',
    huf: '#8B0000',
    btc: '#301934',
  },
  other: {
    eur: '#66CCCC',
    usd: '#99FF99',
    uah: '#FFEB99',
    huf: '#D2691E',
    btc: '#B57EDC',
  },
};

const currencyInfo = {
  eur: { symbol: '€', color: '#0066CC', name: 'Euro' },
  usd: { symbol: '$', color: '#008000', name: 'US Dollar' },
  uah: { symbol: '₴', color: '#FFD700', name: 'Ukrainian Hryvnia' },
  huf: { symbol: 'Ft', color: '#C41E3A', name: 'Hungarian Forint' },
  btc: { symbol: '₿', color: '#FF9900', name: 'Bitcoin' },
};

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  currency: z.enum(['eur', 'usd', 'uah', 'huf', 'btc']),
  balance: z.number().min(0, { message: 'Initial balance must be a positive number.' }),
  type: z.enum(['internet', 'bank', 'cash', 'other']),
  cardNumber: z.string().optional(),
  iban: z.string().optional(),
});

export interface AccountFormRef {
  submitForm: () => Promise<void>;
}

interface FormState {
  isValid: boolean;
  isDirty: boolean;
  values: z.infer<typeof formSchema>;
}

interface AccountFormProps {
  data: z.infer<typeof formSchema> | undefined;
  isEditing: boolean;
  onClose: () => void;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const AccountForm = forwardRef<AccountFormRef, AccountFormProps>(({ data, isEditing, setFormState, showToast }, ref) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      currency: data?.currency || 'eur',
      balance: data?.balance || 0,
      type: data?.type || 'cash',
      cardNumber: data?.cardNumber || '',
      iban: data?.iban || '',
    },
  });

  const { formRef } = useFormLogic({
    form,
    onSubmit: defaultOnSubmit,
    setFormState,
    showToast,
  });

  useImperativeHandle(ref, () => formRef.current!);

  const getTypeButtonStyle = (type: string) => {
    const baseStyle = 'h-20 sm:h-24 transition-colors duration-200';
    const isSelected = form.watch('type') === type;
    const bgColor = colorScheme[type as keyof typeof colorScheme][form.watch('currency') as keyof (typeof colorScheme)['internet']];
    const textColor = isSelected ? 'text-primary-foreground' : 'text-primary';
    return `${baseStyle} ${isSelected ? `bg-[${bgColor}]` : 'bg-background'} ${textColor}`;
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          name="currency"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex justify-between w-full"
                >
                  {Object.entries(currencyInfo).map(([value, info]) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      aria-label={info.name}
                      className={cn(
                        'flex-1 h-14 text-sm font-medium border-2 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground', {
                          'border-primary bg-primary/10': field.value === value,
                          'border-transparent': field.value !== value,
                        })}
                      style={{
                        color: field.value === value ? info.color : undefined,
                      }}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-lg">{info.symbol}</span>
                        <span className="text-xs mt-1">{value.toUpperCase()}</span>
                      </div>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="button" onClick={() => console.log('Is form dirty?', form.formState.isDirty)}>
          Check Dirty State
        </Button>
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
                      key={option.value}
                      type="button"
                      variant={field.value === option.value ? 'default' : 'outline'}
                      className={getTypeButtonStyle(option.value)}
                      style={{
                        backgroundColor: field.value === option.value
                          ? colorScheme[option.value as keyof typeof colorScheme][form.watch('currency') as keyof (typeof colorScheme)['internet']]
                          : undefined,
                      }}
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
                  type="number"
                  placeholder="Enter initial balance"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
      </form>
    </Form>
  );
});
