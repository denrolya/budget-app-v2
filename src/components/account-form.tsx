import { cn } from '@/lib/utils.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CreditCard, MoreHorizontal, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';

const accountSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  currency: z.enum(['eur', 'usd', 'uah', 'huf', 'btc']),
  initialBalance: z.number().min(0, { message: 'Initial balance must be a positive number.' }),
  type: z.enum(['internet', 'bank', 'cash', 'other']),
  cardNumber: z.string().optional(),
  iban: z.string().optional(),
});

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

export default function AccountCreationForm() {
  const [accountType, setAccountType] = useState<string>('internet');
  const [currency, setCurrency] = useState<string>('eur');

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      currency: 'eur',
      initialBalance: 0,
      type: 'internet',
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'currency') {
        setCurrency(value.currency || 'eur');
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  function onSubmit(values: z.infer<typeof accountSchema>) {
    console.log(values);
    // Handle form submission here
  }

  const getTypeButtonStyle = (type: string) => {
    const baseStyle = 'h-20 sm:h-24 transition-colors duration-200';
    const isSelected = accountType === type;
    const bgColor = colorScheme[type as keyof typeof colorScheme][currency as keyof (typeof colorScheme)['internet']];
    const textColor = isSelected ? 'text-primary-foreground' : 'text-primary';
    return `${baseStyle} ${isSelected ? `bg-[${bgColor}]` : 'bg-background'} ${textColor}`;
  };

  return (
    <div className="w-full max-w-md bg-background text-foreground">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
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
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="uah">UAH</SelectItem>
                      <SelectItem value="huf">HUF</SelectItem>
                      <SelectItem value="btc">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="initialBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Balance</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter initial balance"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
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
                      { value: 'internet', label: 'Internet', icon: CreditCard },
                      { value: 'bank', label: 'Bank', icon: Wallet },
                      { value: 'cash', label: 'Cash', icon: Banknote },
                      { value: 'other', label: 'Other', icon: MoreHorizontal },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={field.value === option.value ? 'default' : 'outline'}
                        className={getTypeButtonStyle(option.value)}
                        style={{
                          backgroundColor: accountType === option.value
                            ? colorScheme[option.value as keyof typeof colorScheme][currency as keyof (typeof colorScheme)['internet']]
                            : undefined,
                        }}
                        onClick={() => {
                          field.onChange(option.value);
                          setAccountType(option.value);
                        }}
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
          {accountType === 'bank' && (
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
          <Button type="submit" className="w-full">Create Account</Button>
        </form>
      </Form>
    </div>
  );
}
