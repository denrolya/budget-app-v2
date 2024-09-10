import { zodResolver } from '@hookform/resolvers/zod';
import cn from 'classnames';
import { ArrowDownCircle, ArrowUpCircle, Check, ChevronsUpDown, X } from 'lucide-react';
import moment from 'moment';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Transaction, Type } from '@/models/transaction';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const accounts = [
  { id: 1, name: 'Main Checking', currency: 'USD', icon: '🏦', color: '#FF0000' },
  { id: 2, name: 'Savings', currency: 'USD', icon: '💰', color: '#00FF00' },
  { id: 3, name: 'Credit Card', currency: 'USD', icon: '💳', color: '#0000FF' },
];

const categories = [
  { id: 1, name: 'Groceries', icon: '🍎' },
  { id: 2, name: 'Restaurants', icon: '🍽️' },
  { id: 3, name: 'Rent', icon: '🏠' },
  { id: 4, name: 'Utilities', icon: '💡' },
  { id: 5, name: 'Salary', icon: '💼' },
];

const formSchema = z.object({
  type: z.nativeEnum(Type),
  accountId: z.number(),
  amount: z.number().min(0, 'Amount is required'),
  categoryId: z.number(),
  executedAt: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
  isDraft: z.boolean(),
  compensations: z.array(
    z.object({
      accountId: z.number(),
      amount: z.number().min(1, 'Amount is required'),
      executedAt: z.string().min(1, 'Date is required'),
    }),
  ).optional(),
});

interface TransactionFormProps {
  data: Transaction | undefined;
  isEditing: boolean;
  onClose: () => void;
  setIsFormValid: (isValid: boolean) => void;
}

interface TransactionFormRef {
  submitForm: () => Promise<void>;
}

export const TransactionForm = forwardRef<TransactionFormRef, TransactionFormProps>(({
                                                                                       data,
                                                                                       isEditing,
                                                                                       onClose,
                                                                                       setIsFormValid,
                                                                                     }, ref) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: data?.type || Type.Expense,
      accountId: data?.account.id || accounts[0].id,
      amount: data?.amount || 0,
      categoryId: data?.category.id || categories[0].id,
      executedAt: data?.executedAt.format('YYYY-MM-DDTHH:mm') || moment().format('YYYY-MM-DDTHH:mm'),
      note: data?.note || '',
      isDraft: data?.isDraft || false,
      compensations: data?.compensations?.map(comp => ({
        accountId: comp.account.id,
        amount: comp.amount,
        executedAt: comp.executedAt.format('YYYY-MM-DDTHH:mm'),
      })) || [],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'compensations',
  });

  useImperativeHandle(ref, () => ({
    submitForm: form.handleSubmit(onSubmit),
  }));

  useEffect(() => {
    setIsFormValid(form.formState.isValid);
  }, [form.formState.isValid, setIsFormValid]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log('Form submitted:', values);
      if (isEditing && data?.id) {
        values.id = data.id;
      }
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
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
                  <Input type="number"
                         placeholder="Enter amount" {...field}
                         onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountId"
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
                              onSelect={() => {
                                form.setValue('accountId', account.id);
                              }}
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
          name="categoryId"
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
                      })}>
                      {categories.find(category => category.id === field.value)?.name || 'Select category'}
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
                        {categories.map((category) => (
                          <CommandItem
                            value={category.name}
                            key={category.id}
                            onSelect={() => {
                              form.setValue('categoryId', category.id);
                            }}
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
                <Textarea placeholder="Add a note..." className="h-20" {...field} />
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
                <FormLabel>
                  Draft
                </FormLabel>
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
                    name={`compensations.${index}.accountId`}
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
                                })}>
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
                                {accounts.map((account) => (
                                  <CommandItem
                                    value={account.name}
                                    key={account.id}
                                    onSelect={() => {
                                      form.setValue(`compensations.${index}.accountId`, account.id);
                                    }}
                                  >
                                    <Check className={cn('mr-2 h-4 w-4', {
                                      'opacity-100': account.id === field.value,
                                      'opacity-0': account.id !== field.value,
                                    })} />
                                    {account.icon} {account.name}
                                  </CommandItem>
                                ))}
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
