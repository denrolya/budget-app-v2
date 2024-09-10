import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  accountFrom: z.string().min(1, { message: 'Account From is required' }),
  accountTo: z.string().min(1, { message: 'Account To is required' }),
  amount: z.string().min(1, { message: 'Amount is required' }).refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  rate: z.string().min(1, { message: 'Rate is required' }).refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Rate must be a positive number',
  }),
  feeAmount: z.string().min(1, { message: 'Fee Amount is required' }).refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Fee Amount must be a non-negative number',
  }),
  feeAccount: z.string().min(1, { message: 'Fee Account is required' }),
  executedAt: z.string().min(1, { message: 'Executed At is required' }),
  note: z.string().optional(),
});

export const TransferForm = () => {
  const [calculationMode, setCalculationMode] = useState('result');
  const [resultingAmount, setResultingAmount] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountFrom: '',
      accountTo: '',
      amount: '',
      rate: '1',
      feeAmount: '0',
      feeAccount: '',
      executedAt: '',
      note: '',
    },
  });

  const { watch, setValue } = form;

  const calculateMissingValue = (formValues: z.infer<typeof formSchema>) => {
    const amount = parseFloat(formValues.amount) || 0;
    const rate = parseFloat(formValues.rate) || 1;
    const feeAmount = parseFloat(formValues.feeAmount) || 0;
    const result = parseFloat(resultingAmount) || 0;

    switch (calculationMode) {
      case 'result':
        setResultingAmount(((amount * rate) - feeAmount).toFixed(2));
        break;
      case 'amount':
        setValue('amount', ((result + feeAmount) / rate).toFixed(2));
        break;
      case 'rate':
        setValue('rate', ((result + feeAmount) / amount).toFixed(4));
        break;
      case 'fee':
        setValue('feeAmount', ((amount * rate) - result).toFixed(2));
        break;
    }
  };

  useEffect(() => {
    const subscription = watch((value) => calculateMissingValue(value));
    return () => subscription.unsubscribe();
  }, [calculateMissingValue, watch, calculationMode]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
    // Here you would typically send the data to your backend
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="accountFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account From</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="account1">Account 1</SelectItem>
                    <SelectItem value="account2">Account 2</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account To</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="account1">Account 1</SelectItem>
                    <SelectItem value="account2">Account 2</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} readOnly={calculationMode === 'amount'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate</FormLabel>
                <FormControl>
                  <Input type="number" {...field} readOnly={calculationMode === 'rate'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="feeAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} readOnly={calculationMode === 'fee'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="feeAccount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="account1">Account 1</SelectItem>
                    <SelectItem value="account2">Account 2</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="executedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Executed At</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Add a note..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border rounded-md overflow-hidden mt-4">
          <div className="p-3 bg-muted">
            <Label className="text-sm">
              {calculationMode === 'result' ? 'Resulting Amount' :
                calculationMode === 'amount' ? 'Calculate Amount' :
                  calculationMode === 'rate' ? 'Calculate Rate' : 'Calculate Fee'}
            </Label>
            <Input
              type="number"
              value={resultingAmount}
              onChange={(e) => setResultingAmount(e.target.value)}
              readOnly={calculationMode === 'result'}
              className="w-full mt-1"
            />
          </div>
          <div className="flex border-t border-border">
            <Button
              type="button"
              onClick={() => setCalculationMode('result')}
              className={`flex-1 rounded-none ${
                calculationMode === 'result'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Result
            </Button>
            <Button
              type="button"
              onClick={() => setCalculationMode('amount')}
              className={`flex-1 rounded-none ${
                calculationMode === 'amount'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Amount
            </Button>
            <Button
              type="button"
              onClick={() => setCalculationMode('rate')}
              className={`flex-1 rounded-none ${
                calculationMode === 'rate'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Rate
            </Button>
            <Button
              type="button"
              onClick={() => setCalculationMode('fee')}
              className={`flex-1 rounded-none ${
                calculationMode === 'fee'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Fee
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
