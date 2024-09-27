import { zodResolver } from '@hookform/resolvers/zod';
import cn from 'classnames';
import moment from 'moment';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { useForm as useFormContext } from '@/contexts/Form';
import { useFinanceData } from '@/contexts/FinanceData';
import AccountTypeahead from '@/components/common/AccountTypeahead';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormLogic } from '@/hooks/useFormLogic';
import { api } from '@/services/api';

const formSchema = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  amount: z.number().min(0, 'Amount must be a positive number'),
  rate: z.number().min(0, 'Rate must be a positive number'),
  fee: z.number().min(0, 'Fee must be non-negative').optional(),
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
  onClose: () => void;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface TransferFormRef {
  submitForm: () => Promise<void>;
}

export const TransferForm = forwardRef<TransferFormRef, TransferFormProps>(({
                                                                              setFormState,
                                                                              showToast,
                                                                            }, ref) => {
  const { refetchAccounts } = useFinanceData();
  const [calculationMode, setCalculationMode] = useState('result');
  const [resultingAmount, setResultingAmount] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: undefined,
      to: undefined,
      amount: 0,
      rate: 0,
      fee: undefined,
      feeAccount: undefined,
      executedAt: moment().format('YYYY-MM-DDTHH:mm'),
      note: undefined,
    },
    mode: 'onChange',
  });

  const { watch, setValue } = form;
  const { submitForm } = useFormContext();
  const { formRef } = useFormLogic({
    form,
    setFormState,
    onSubmit: async (values: z.infer<typeof formSchema>) => {
      try {
        const formattedData = {
          from: values.from,
          to: values.to,
          amount: values.amount.toString(),
          rate: values.rate.toString(),
          fee: values.fee ? values.fee.toString() : undefined,
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
        showToast('Failed to submit transfer. Please try again.', 'error');
      }
    },
  });

  const calculateMissingValue = useCallback((formValues: z.infer<typeof formSchema>) => {
    const amount = formValues.amount || 0;
    const rate = formValues.rate || 1;
    const fee = formValues.fee || 0;
    const result = resultingAmount || 0;

    switch (calculationMode) {
      case 'result':
        setResultingAmount(((amount * rate) - fee).toFixed(2));
        break;
      case 'amount':
        setValue('amount', (result + fee) / rate);
        break;
      case 'rate':
        setValue('rate', (result + fee) / amount);
        break;
      case 'fee':
        setValue('fee', (amount * rate) - result);
        break;
    }
  }, [calculationMode, resultingAmount, setValue]);

  useEffect(() => {
    const subscription = watch((value) => calculateMissingValue(value));
    return () => subscription.unsubscribe();
  }, [calculateMissingValue, watch, calculationMode]);

  useImperativeHandle(ref, () => formRef.current!);

  return (
    <Form {...form}>
      <form className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            name="from"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>From</FormLabel>
                <AccountTypeahead
                  {...field}
                  multiple={false}
                  className={cn('w-full justify-between', {
                    'text-muted-foreground': !field.value,
                  })}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="to"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>To</FormLabel>
                <AccountTypeahead
                  {...field}
                  multiple={false}
                  className={cn('w-full justify-between', {
                    'text-muted-foreground': !field.value,
                  })}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            name="amount"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    readOnly={calculationMode === 'amount'}
                    onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="rate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
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
            name="fee"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee Amount</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    readOnly={calculationMode === 'fee'}
                    onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="feeAccount"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Fee Account</FormLabel>
                <AccountTypeahead
                  {...field}
                  multiple={false}
                  className={cn('w-full justify-between', {
                    'text-muted-foreground': !field.value,
                  })}
                />
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
              className={cn('flex-1 rounded-none', {
                'bg-primary text-primary-foreground': calculationMode === 'result',
                'bg-secondary text-secondary-foreground hover:bg-secondary/80': calculationMode !== 'result',
              })}
            >
              Result
            </Button>
            <Button
              type="button"
              onClick={() => setCalculationMode('amount')}
              className={cn('flex-1 rounded-none', {
                'bg-primary text-primary-foreground': calculationMode === 'amount',
                'bg-secondary text-secondary-foreground hover:bg-secondary/80': calculationMode !== 'amount',
              })}
            >
              Amount
            </Button>
            <Button
              type="button"
              onClick={() => setCalculationMode('rate')}
              className={cn('flex-1 rounded-none', {
                'bg-primary text-primary-foreground': calculationMode === 'rate',
                'bg-secondary text-secondary-foreground hover:bg-secondary/80': calculationMode !== 'rate',
              })}
            >
              Rate
            </Button>
            <Button
              type="button"
              onClick={() => setCalculationMode('fee')}
              className={cn('flex-1 rounded-none', {
                'bg-primary text-primary-foreground': calculationMode === 'fee',
                'bg-secondary text-secondary-foreground hover:bg-secondary/80': calculationMode !== 'fee',
              })}
            >
              Fee
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
});

export default TransferForm;
