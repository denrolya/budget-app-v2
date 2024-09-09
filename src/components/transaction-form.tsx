import { zodResolver } from '@hookform/resolvers/zod';
import cn from 'classnames';
import { ArrowDownCircle, ArrowUpCircle, Check, ChevronsUpDown, X } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

const categories = [
  { id: 1, name: 'Groceries', rootCategory: 'Food', icon: '🍎' },
  { id: 2, name: 'Restaurants', rootCategory: 'Food', icon: '🍽️' },
  { id: 3, name: 'Rent', rootCategory: 'Housing', icon: '🏠' },
  { id: 4, name: 'Utilities', rootCategory: 'Housing', icon: '💡' },
  { id: 5, name: 'Salary', rootCategory: 'Income', icon: '💼' },
];

const accounts = [
  { id: 1, name: 'Main Checking', currency: 'USD', icon: '🏦' },
  { id: 2, name: 'Savings', currency: 'USD', icon: '💰' },
  { id: 3, name: 'Credit Card', currency: 'USD', icon: '💳' },
];

const formSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  account: z.string().min(1, 'Account is required'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
  compensations: z.array(
    z.object({
      amount: z.string().min(1, 'Amount is required'),
      account: z.string().min(1, 'Account is required'),
      date: z.string().min(1, 'Date is required'),
    }),
  ).optional(),
});

interface Props {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onFormStateChange: (isValid: boolean) => void;
}

export const TransactionForm = forwardRef<{ submitForm: () => void }, Props>(({ onSubmit, onFormStateChange }, ref) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      category: '',
      account: '',
      amount: 0,
      date: '',
      note: '',
      compensations: [],
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
    onFormStateChange(form.formState.isValid);
  }, [form.formState.isValid, onFormStateChange]);

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
                    variant={field.value === 'expense' ? 'default' : 'outline'}
                    className={cn('w-full justify-start space-x-2', {
                      'bg-primary text-primary-foreground': field.value === 'expense',
                    })}
                    onClick={() => field.onChange('expense')}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    <span>Expense</span>
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'income' ? 'default' : 'outline'}
                    className={cn('w-full justify-start space-x-2', {
                      'bg-primary text-primary-foreground': field.value === 'income',
                    })}
                    onClick={() => field.onChange('income')}
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
                  <Input type="number" placeholder="Enter amount" {...field} />
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
                        })}>
                        {field.value || 'Select account'}
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
                                form.setValue('account', account.name);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', {
                                'opacity-100': account.name === field.value,
                                'opacity-0': account.name !== field.value,
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
          name="date"
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
                      })}>
                      {field.value || 'Select category'}
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
                              form.setValue('category', category.name);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', {
                              'opacity-100': category.name === field.value,
                              'opacity-0': category.name !== field.value,
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

        {form.watch('type') === 'expense' && (
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
                            {...field}
                            className="w-full"
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
                                })}>
                                {field.value || 'Account'}
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
                                      form.setValue(`compensations.${index}.account`, account.name);
                                    }}
                                  >
                                    <Check className={cn('mr-2 h-4 w-4', {
                                      'opacity-100': account.name === field.value,
                                      'opacity-0': account.name !== field.value,
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
                    name={`compensations.${index}.date`}
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
              onClick={() => append({ amount: '', account: '', date: '' })}
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
