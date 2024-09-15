import { generateTransactions } from '@/services/transactionGenerator.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import cn from 'classnames';
import { ArrowDownCircle, ArrowUpCircle, Check, ChevronsUpDown, X } from 'lucide-react';
import moment from 'moment';
import { forwardRef, useImperativeHandle } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { useForm as useFormContext } from '@/contexts/Form.tsx';
import { useActiveAccountsWithDefaultOrder, useCategories } from '@/contexts/FinanceData';
import { defaultOnSubmit, useFormLogic } from '@/hooks/useFormLogic';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Transaction, Type } from '@/models/transaction';

interface FormState {
  isValid: boolean;
  isDirty: boolean;
  values: z.infer<typeof formSchema>;
}

interface TransactionFormProps {
  data: Transaction | undefined;
  isEditing: boolean;
  onClose: () => void;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface TransactionFormRef {
  submitForm: () => Promise<void>;
}

const formSchema = z.object({
  type: z.nativeEnum(Type),
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

export const TransactionForm = forwardRef<TransactionFormRef, TransactionFormProps>(({ data, isEditing, setFormState, showToast }, ref) => {
  const accounts = useActiveAccountsWithDefaultOrder();
  const categories = useCategories();
  const { submitForm } = useFormContext();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: data?.type || Type.Expense,
      account: isEditing ? data?.account.id : undefined,
      amount: isEditing ? data?.amount : undefined,
      category: isEditing ? data?.category.id : undefined,
      executedAt: data?.executedAt ? moment(data.executedAt).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm'),
      note: data?.note || undefined,
      isDraft: data?.isDraft || false,
      compensations: data?.compensations?.map(comp => ({
        account: isEditing ? comp.account.id : undefined,
        amount: comp.amount,
        executedAt: moment(comp.executedAt).format('YYYY-MM-DDTHH:mm'),
      })) || [],
    },
    mode: 'onChange',
  });
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isEditing) {
        // TODO: Implement edit
        logger.info(values, '[TransactionForm][Edit]');
      } else {
        // TODO: Implement create
        logger.info(values, '[TransactionForm][Create]');
      }

      // Call submitForm to emit the event and close the form
      submitForm(values);
    } catch (error) {
      // Handle error
      console.error('Form submission failed:', error);
    }
  };
  const { formRef } = useFormLogic({
    form,
    onSubmit: handleSubmit,
    setFormState,
    showToast,
  });

  useImperativeHandle(ref, () => formRef.current!);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'compensations',
  });


  const filteredCategories = categories.filter(category => category.type === form.watch('type'));

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
                    variant={field.value === Type.Expense ? 'default' : 'outline'}
                    className={cn('w-full justify-start space-x-2', {
                      'bg-primary text-primary-foreground': field.value === Type.Expense,
                    })}
                    onClick={() => field.onChange(Type.Expense)}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    <span>Expense</span>
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === Type.Income ? 'default' : 'outline'}
                    className={cn('w-full justify-start space-x-2', {
                      'bg-primary text-primary-foreground': field.value === Type.Income,
                    })}
                    onClick={() => field.onChange(Type.Income)}
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
                    onChange={e => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Account</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn('w-full justify-between', {
                          'text-muted-foreground': !field.value,
                        })}
                      >
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
                              onSelect={() => form.setValue('account', account.id)}
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
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn('w-full justify-between', {
                        'text-muted-foreground': !field.value,
                      })}
                    >
                      {filteredCategories.find(category => category.id === field.value)?.name || 'Select category'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search category..." />
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {filteredCategories.map((category) => (
                          <CommandItem
                            value={category.name}
                            key={category.id}
                            onSelect={() => form.setValue('category', category.id)}
                          >
                            <Check className={cn('mr-2 h-4 w-4', {
                              'opacity-100': category.id === field.value,
                              'opacity-0': category.id !== field.value,
                            })} />
                            {category.icon} {category.name}
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

        {form.watch('type') === Type.Expense && (
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
                      <FormItem className="flex-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn('w-full justify-between', {
                                  'text-muted-foreground': !field.value,
                                })}
                              >
                                {accounts.find(account => account.id === field.value)?.name || 'Account'}
                                <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
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
                                      onSelect={() => form.setValue(`compensations.${index}.account`, account.id)}
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
                accountId: accounts[0].id,
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
