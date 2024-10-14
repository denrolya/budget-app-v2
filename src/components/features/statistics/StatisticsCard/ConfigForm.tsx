import cn from 'classnames';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';

import { Switch } from '@/components/ui/switch.tsx';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardConfig } from '@/constants/dashboard-config';
import { Type as TransactionType } from '@/models/Transaction';


const comparisons = [
  { value: 'previous', label: 'Previous period' },
  { value: 'same-last-year', label: 'Same period last year' },
];

const periods = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const statTypes = [
  { value: 'sum', label: 'Sum' },
  { value: 'daily', label: 'Daily' },
  { value: 'avg', label: 'Average' },
  { value: 'min-max', label: 'Min-Max' },
];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.nativeEnum(TransactionType),
  categories: z.array(z.string()).optional(),
  interval: z.object({
    unit: z.enum(['day', 'week', 'month', 'quarter', 'year'] as const),
    value: z.number().int().positive()
  }),
  period: z.object({
    unit: z.enum(['day', 'week', 'month', 'quarter', 'year'] as const),
    value: z.number().int().positive()
  }).optional(),
  comparison: z.enum(['previous', 'same-last-year']),
  statType: z.enum(['sum', 'daily', 'avg', 'min-max'])
});

interface Props {
  initialConfig: CardConfig
  onSubmit: (config: CardConfig) => void
}

export const ConfigForm: React.FC<Props> = ({ initialConfig, onSubmit }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialConfig,
  });
  const [usePeriod, setUsePeriod] = useState(!!initialConfig.period);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>The title of the statistics card.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="type"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
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

        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <CategoryTypeahead
                {...field}
                multiple
                valueField="name"
                type={form.watch('type')}
                className={cn('w-full justify-between', {
                  'text-muted-foreground': !field.value,
                })}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Interval</FormLabel>
          <div className="flex">
            <Controller
              name="interval.value"
              control={form.control}
              render={({ field }) => (
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="rounded-r-none"
                  />
                </FormControl>
              )}
            />
            <Controller
              name="interval.unit"
              control={form.control}
              render={({ field }) => (
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="rounded-l-none border-l-0 min-w-[120px]">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {(['day', 'week', 'month', 'quarter', 'year'] as const).map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}(s)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              )}
            />
          </div>
          <FormDescription>The interval for data aggregation (e.g., 1 day, 1 week).</FormDescription>
          <FormMessage>{form.formState.errors.interval?.message}</FormMessage>
        </FormItem>

        <FormItem>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <FormLabel>Custom Period</FormLabel>
              <FormDescription>
                Enable to set a custom period different from the interval.
              </FormDescription>
            </div>
            <Switch
              checked={usePeriod}
              onCheckedChange={setUsePeriod}
            />
          </div>
        </FormItem>
        {usePeriod && (
          <FormItem>
            <FormLabel>Period</FormLabel>
            <div className="flex">
              <Controller
                name="period.value"
                control={form.control}
                render={({ field }) => (
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="rounded-r-none"
                    />
                  </FormControl>
                )}
              />
              <Controller
                name="period.unit"
                control={form.control}
                render={({ field }) => (
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-l-none border-l-0 min-w-[120px]">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['day', 'week', 'month', 'quarter', 'year'] as const).map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}(s)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                )}
              />
            </div>
            <FormDescription>The period for the statistics (e.g., 1 month, 2 weeks).</FormDescription>
            <FormMessage>{form.formState.errors.period?.message}</FormMessage>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="comparison"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comparison Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select comparison type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="previous">Previous Period</SelectItem>
                  <SelectItem value="same-last-year">Same Period Last Year</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>How to compare the current period.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="statType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statistic Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select statistic type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="avg">Average</SelectItem>
                  <SelectItem value="min-max">Min-Max</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The type of statistic to display.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
};

export default ConfigForm;
