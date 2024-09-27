import { zodResolver } from '@hookform/resolvers/zod';
import cn from 'classnames';
import { ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react';
import moment from 'moment';
import React, { forwardRef, useImperativeHandle } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { useFinanceData } from '@/contexts/FinanceData';
import AccountTypeahead from '@/components/common/AccountTypeahead';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm as useFormContext } from '@/contexts/Form';
import { useFormLogic } from '@/hooks/useFormLogic';
import Transaction, { Type as TransactionType } from '@/models/Transaction';
import { api } from '@/services/api';

interface FormState {
  isValid: boolean;
  isDirty: boolean;
  values: z.infer<typeof formSchema>;
}

interface TransactionFormProps {
  values: Transaction | undefined;
  onClose: () => void;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  key: string;
}

interface TransactionFormRef {
  submitForm: () => Promise<void>;
}

const formSchema = z.object({
  type: z.nativeEnum(TransactionType),
  account: z.number().int().positive(),
  amount: z.number().min(0, 'Amount must be non-negative'),
  category: z.number().int().positive(),
  executedAt: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
  isDraft: z.boolean().default(false),
  compensations: z.array(
    z.object({
      account: z.number().int().positive(),
      amount: z.number().positive('Amount must be positive'),
      executedAt: z.string().min(1, 'Date is required'),
    }),
  ).optional(),
});

const formatTransactionData = (values: z.infer<typeof formSchema>, existingData: Transaction | undefined) => ({
  account: values.account,
  amount: values.amount.toString(),
  category: values.category,
  executedAt: moment(values.executedAt).toISOString(),
  isDraft: values.isDraft ?? false,
  note: values.note || '',
  type: values.type,
  compensations: values.compensations?.map((comp, index) => {
    const existingComp = existingData?.compensations?.[index];

    return {
      id: existingComp ? `api/transactions/${existingComp.id}` : undefined,
      account: comp.account,
      amount: comp.amount.toString(),
      category: 137,
      executedAt: moment(comp.executedAt).toISOString(),
      isDraft: false,
      note: `[Compensation]: ${values.note || existingData?.id}`,
      type: TransactionType.Income,
    };
  }),
});


/**
 * TODO: Organize. Separate logic form visual components.
 */
export const TransactionForm = forwardRef<TransactionFormRef, TransactionFormProps>((props, ref) => {
  const { refetchAccounts } = useFinanceData();
  const { values: data, setFormState } = props;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...data,
      type: data?.type || TransactionType.Expense,
      account: data?.id ? data?.account.id : undefined,
      amount: data?.id ? data?.amount : undefined,
      category: data?.id ? data?.category.id : undefined,
      executedAt: data?.executedAt ? moment(data.executedAt).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm'),
      note: data?.note || undefined,
      isDraft: data?.isDraft ?? false,
      compensations: data?.compensations?.map(comp => ({
        ...comp,
        account: data?.id ? comp.account.id : undefined,
        amount: comp.amount,
        executedAt: moment(comp.executedAt).format('YYYY-MM-DDTHH:mm'),
      })) || [],
    },
    mode: 'onChange',
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'compensations',
  });
  const { submitForm } = useFormContext();
  const { formRef } = useFormLogic({
    form,
    setFormState,
    onSubmit: async (values: z.infer<typeof formSchema>) => {
      try {
        const formattedData = formatTransactionData(values, data);

        if (data?.id) {
          const response = await api.put(`/api/transactions/${data.id}`, formattedData);
          logger.info(response, 'Transaction Edit');
        } else {
          const response = await api.post(`/api/transactions/${values.type}`, formattedData);
          logger.info(response, 'Transaction Create');
        }

        await refetchAccounts();
        submitForm(values);
      } catch (error) {
        console.error('Form submission failed:', error);
      }
    },
  });
  useImperativeHandle(ref, () => formRef.current!);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          name="type"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <FormControl>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={field.value === TransactionType.Expense ? 'default' : 'outline'}
                    className={cn('w-full justify-start space-x-2', {
                      'bg-primary text-primary-foreground': field.value === TransactionType.Expense,
                    })}
                    onClick={() => field.onChange(TransactionType.Expense)}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    <span>Expense</span>
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === TransactionType.Income ? 'default' : 'outline'}
                    className={cn('w-full justify-start space-x-2', {
                      'bg-primary text-primary-foreground': field.value === TransactionType.Income,
                    })}
                    onClick={() => field.onChange(TransactionType.Income)}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    <span>Income</span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => {
                      field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Account</FormLabel>
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
            name="account"
          />
        </div>

        <FormField
          control={form.control}
          name="executedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" className="w-full" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <CategoryTypeahead
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

        <FormField
          control={form.control}
          name="isDraft"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Draft</FormLabel>
                <p className="text-sm text-muted-foreground">
                  This transaction will be saved as a draft.
                </p>
              </div>
            </FormItem>
          )}
        />

        {form.watch('type') === TransactionType.Expense && (
          <div>
            <Label>Compensations</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="mt-2 p-2 border border-border rounded-md space-y-2">
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`compensations.${index}.amount`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Amount"
                            className="w-full"
                            {...field}
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`compensations.${index}.account`}
                    render={({ field }) => (
                      <FormItem>
                        <AccountTypeahead multiple={false} className={cn('w-full justify-between', {
                          'text-muted-foreground': !field.value,
                        })} {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`compensations.${index}.executedAt`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                    className="p-2 h-9 w-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              className="mt-2 w-full"
              onClick={() => append({
                account: -1,
                amount: 0,
                executedAt: moment().format('YYYY-MM-DDTHH:mm'),
              })}
            >
              Add Compensation
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
});


export default TransactionForm;
