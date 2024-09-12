import { zodResolver } from '@hookform/resolvers/zod';
import cn from 'classnames';
import { Check, ChevronsUpDown } from 'lucide-react';
import moment from 'moment';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { defaultOnSubmit, useFormLogic } from '@/hooks/useFormLogic';
import { Transfer } from '@/models/transfer';

const accounts = [
  { id: 1, name: 'Main Checking', currency: 'USD', icon: '🏦', color: '#FF0000' },
  { id: 2, name: 'Savings', currency: 'USD', icon: '💰', color: '#00FF00' },
  { id: 3, name: 'Credit Card', currency: 'USD', icon: '💳', color: '#0000FF' },
];

const formSchema = z.object({
  accountFrom: z.number().int().positive(),
  accountTo: z.number().int().positive(),
  amount: z.number().min(0, 'Amount must be a positive number'),
  rate: z.number().min(0, 'Rate must be a positive number'),
  feeAmount: z.number().min(0, 'Fee must be non-negative').optional(),
  feeAccount: z.number().int().positive().optional(),
  executedAt: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
});

interface FormState {
  isValid: boolean;
  isDirty: boolean;
  values: z.infer<typeof formSchema>;
}

interface TransferFormProps {
  data: Transfer | undefined;
  isEditing: boolean;
  onClose: () => void;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface TransferFormRef {
  submitForm: () => Promise<void>;
}

/**
 * TODO:
 * 1. When fee amount or account value is provided the missing fee field becomes required and form is not valid otherwise
 * 2. How do I edit transfer??
 * 3. Account selector should be able to be cleared.
 *
 */
export const TransferForm = forwardRef<TransferFormRef, TransferFormProps>(({
                                                                              data,
                                                                              isEditing,
                                                                              setFormState,
                                                                              showToast,
                                                                            }, ref) => {
  const [calculationMode, setCalculationMode] = useState('result');
  const [resultingAmount, setResultingAmount] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountFrom: undefined,
      accountTo: undefined,
      amount: 0,
      rate: 0,
      feeAmount: undefined,
      feeAccount: undefined,
      executedAt: moment().format('YYYY-MM-DDTHH:mm'),
      note: undefined,
    },
    mode: 'onChange',
  });

  const { watch, setValue } = form;

  const calculateMissingValue = (formValues: z.infer<typeof formSchema>) => {
    const amount = formValues.amount || 0;
    const rate = formValues.rate || 1;
    const feeAmount = formValues.feeAmount || 0;
    const result = resultingAmount || 0;

    switch (calculationMode) {
      case 'result':
        setResultingAmount(((amount * rate) - feeAmount).toFixed(2));
        break;
      case 'amount':
        setValue('amount', (result + feeAmount) / rate);
        break;
      case 'rate':
        setValue('rate', (result + feeAmount) / amount);
        break;
      case 'fee':
        setValue('feeAmount', (amount * rate) - result);
        break;
    }
  };

  useEffect(() => {
    const subscription = watch((value) => calculateMissingValue(value));
    return () => subscription.unsubscribe();
  }, [calculateMissingValue, watch, calculationMode]);

  const { formRef } = useFormLogic({
    form,
    onSubmit: defaultOnSubmit,
    setFormState,
    showToast,
  });

  useImperativeHandle(ref, () => formRef.current!);

  return (
    <Form {...form}>
      <form className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="accountFrom"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Account From</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn('w-full justify-between', {
                          'text-muted-foreground': !field.value,
                        })}>
                        {accounts.find(account => account.id === field.value)?.name || 'Select account'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search account..." />
                      <CommandEmpty>No account found.</CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {accounts.map((account) => (
                            <CommandItem
                              value={account.name}
                              key={account.id}
                              onSelect={() => form.setValue('accountFrom', account.id)}
                            >
                              <Check className={cn('mr-2 h-4 w-4', {
                                'opacity-100': account.id === field.value,
                                'opacity-0': account.id !== field.value,
                              })} />
                              {account.icon} {account.name}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountTo"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Account From</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn('w-full justify-between', {
                          'text-muted-foreground': !field.value,
                        })}>
                        {accounts.find(account => account.id === field.value)?.name || 'Select account'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search account..." />
                      <CommandEmpty>No account found.</CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {accounts.map((account) => (
                            <CommandItem
                              value={account.name}
                              key={account.id}
                              onSelect={() => form.setValue('accountTo', account.id)}
                            >
                              <Check className={cn('mr-2 h-4 w-4', {
                                'opacity-100': account.id === field.value,
                                'opacity-0': account.id !== field.value,
                              })} />
                              {account.icon} {account.name}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  <Input type="number" {...field}
                         readOnly={calculationMode === 'amount'}
                         onChange={e => field.onChange(e.target.valueAsNumber)} />
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
                  <Input type="number" {...field}
                         readOnly={calculationMode === 'rate'}
                         onChange={e => field.onChange(e.target.valueAsNumber)} />
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
                  <Input type="number" {...field}
                         readOnly={calculationMode === 'fee'}
                         onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="feeAccount"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Account From</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn('w-full justify-between', {
                          'text-muted-foreground': !field.value,
                        })}>
                        {accounts.find(account => account.id === field.value)?.name || 'Select account'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search account..." />
                      <CommandEmpty>No account found.</CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {accounts.map((account) => (
                            <CommandItem
                              value={account.name}
                              key={account.id}
                              onSelect={() => form.setValue('feeAccount', account.id)}
                            >
                              <Check className={cn('mr-2 h-4 w-4', {
                                'opacity-100': account.id === field.value,
                                'opacity-0': account.id !== field.value,
                              })} />
                              {account.icon} {account.name}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
              onChange={(e) => setResultingAmount(e.target.valueAsNumber)}
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
});
