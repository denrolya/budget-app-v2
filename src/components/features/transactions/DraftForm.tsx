import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import moment from 'moment';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { useFormLogic } from '@/hooks/useFormLogic';
import { useForm as useFormContext } from '@/contexts/Form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAccountsWithDefaultOrder, useCategories, useFinanceData } from '@/contexts/FinanceData';
import Category from '@/models/Category';
import { Type as TransactionType } from '@/models/Transaction';
import { createTransaction } from '@/services/api/transaction';

interface Props {
  children: React.ReactNode;
}

interface TransactionFormRef {
  submitForm: () => Promise<void>;
}

export const DraftForm: React.FC<Props> = forwardRef<TransactionFormRef, Props>(({ children }, ref) => {
  const { list: allCategories } = useCategories();
  const accounts = useAccountsWithDefaultOrder();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'amount' | 'category' | 'account'>('type');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { refetchAccounts } = useFinanceData();
  const { submitForm, updateFormState, formState: { values: data } } = useFormContext();

  const transactionSchema = z.object({
    type: z.nativeEnum(TransactionType),
    amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
    category: z.string().refine(
      (val) => allCategories.some(category => category.id.toString() === val),
      { message: 'Invalid category' },
    ),
    account: z.string().refine(
      (val) => accounts.some(account => account.id.toString() === val),
      { message: 'Invalid account' },
    ),
    isDraft: z.boolean(),
    executedAt: z.string(),
  });
  type TransactionFormData = z.infer<typeof transactionSchema>


  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: undefined,
      amount: '',
      category: '',
      account: '',
      isDraft: true,
      executedAt: moment().toISOString(),
    },
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    reset,
    trigger,
  } = form;

  const selectedType = watch('type');

  useEffect(() => {
    if (isPopoverOpen) {
      inputRef.current?.focus();
    }
  }, [isPopoverOpen, step]);

  const moveToNextStep = useCallback(() => {
    setStep(currentStep => {
      switch (currentStep) {
        case 'type':
          return 'amount';
        case 'amount':
          return 'category';
        case 'category':
          return 'account';
        case 'account':
          setIsModalOpen(true);
          setIsPopoverOpen(false);
          return currentStep;
        default:
          return currentStep;
      }
    });
    setInputValue('');
  }, []);

  const validateStep = useCallback(async () => await trigger(step), [step, trigger]);

  const handleSelect = useCallback(async (selectedValue: string) => {
    setValue(step, selectedValue);
    const isValid = await validateStep();
    if (isValid) {
      reset({ ...watch(), [step]: selectedValue });
      setInputValue('');
      moveToNextStep();
    }
  }, [setValue, step, validateStep, reset, watch, moveToNextStep]);

  const getCommandItems = useMemo(() => {
    switch (step) {
      case 'type':
        return [
          { value: TransactionType.Expense, label: 'Expense' },
          { value: TransactionType.Income, label: 'Income' },
        ];
      case 'category':
        return (allCategories as Category[])
          .filter(category => category.type === selectedType)
          .map(category => ({ value: category.id.toString(), label: category.name }));
      case 'account':
        return accounts.map(account => ({ value: account.id.toString(), label: account.nameWithCurrency }));
      default:
        return [];
    }
  }, [step, allCategories, selectedType, accounts]);

  const getPlaceholder = useMemo(() => {
    const placeholders = {
      type: 'Select transaction type (expense or income)',
      amount: 'Enter amount (e.g., 50.10)',
      category: 'Select or enter category',
      account: 'Select or enter account',
    };
    return placeholders[step];
  }, [step]);

  const { formRef } = useFormLogic({
    form,
    setFormState: updateFormState,
    onSubmit: async (values: z.infer<typeof transactionSchema>) => {
      setIsSubmitting(true);
      try {
        const response = await createTransaction({
          type: data.type,
          amount: parseFloat(data.amount),
          category: parseInt(data.category),
          account: parseInt(data.account),
          isDraft: data.isDraft,
          executedAt: data.executedAt,
        });
        logger.info(response, 'Draft Transaction Created:');

        await refetchAccounts();
        submitForm(values);
        setIsModalOpen(false);
        resetForm();
        toast.success('Transaction submitted successfully!', {
          action: {
            label: 'Close',
            onClick: () => toast.dismiss()
          }
        });
      } catch (error) {
        console.error('Form submission failed:', error);
        toast.error('Failed to submit transaction. Please try again.', {
          action: {
            label: 'Close',
            onClick: () => toast.dismiss()
          }
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });
  useImperativeHandle(ref, () => formRef.current!);

  const resetForm = useCallback(() => {
    setStep('type');
    reset({
      type: undefined,
      amount: '',
      category: '',
      account: '',
      isDraft: true,
      executedAt: moment().toISOString(),
    });
    setInputValue('');
    setIsPopoverOpen(false);
  }, [reset]);

  const isValidInput = useCallback((value: string) => {
    switch (step) {
      case 'type':
        return Object.values(TransactionType).includes(value as TransactionType);
      case 'amount':
        return !isNaN(parseFloat(value)) && parseFloat(value) > 0;
      case 'category':
        return allCategories.some(category => category.id.toString() === value);
      case 'account':
        return accounts.some(account => account.id.toString() === value);
      default:
        return false;
    }
  }, [step, allCategories, accounts]);

  return (
    <div className="space-y-4">
      <Popover open={isPopoverOpen} onOpenChange={(open) => {
        setIsPopoverOpen(open);
        if (!open) resetForm();
      }}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <Controller
              name={step}
              control={control}
              render={({ field }) => (
                <CommandInput
                  ref={inputRef}
                  placeholder={getPlaceholder}
                  value={inputValue}
                  onValueChange={(value) => {
                    setInputValue(value);
                    field.onChange(value);
                    if (step === 'amount') {
                      setValue('amount', value);
                    }
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && inputValue && isValidInput(inputValue)) {
                      e.preventDefault();
                      await handleSelect(inputValue);
                    }
                  }}
                />
              )}
            />
            <CommandList>
              <CommandEmpty>No results found</CommandEmpty>
              <CommandGroup heading={step.charAt(0).toUpperCase() + step.slice(1)}>
                {getCommandItems.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={handleSelect}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="p-2 flex justify-between items-center border-t">
            <span className="text-sm text-muted-foreground">
              Step {['type', 'amount', 'category', 'account'].indexOf(step) + 1} of 4
            </span>
            <Button
              size="sm"
              onClick={() => inputValue && isValidInput(inputValue) && handleSelect(inputValue)}
              disabled={!inputValue || !isValidInput(inputValue)}
            >
              {step === 'account' ? 'Finish' : 'Next'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {errors[step] && (
        <Alert variant="destructive">
          <AlertDescription>{errors[step]?.message}</AlertDescription>
        </Alert>
      )}

      <Drawer open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Transaction Details</DrawerTitle>
            <DrawerDescription>
              Review your transaction details below.
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid grid-cols-2 gap-4">
            <Label>Type:</Label>
            <span>{watch('type')}</span>
            <Label>Amount:</Label>
            <span>{watch('amount')}</span>
            <Label>Category:</Label>
            <span>{(allCategories as Category[]).find(c => c.id.toString() === watch('category'))?.name || watch('category')}</span>
            <Label>Account:</Label>
            <span>{accounts.find(a => a.id.toString() === watch('account'))?.nameWithCurrency || watch('account')}</span>
            <Label>Is Draft:</Label>
            <span>{watch('isDraft') ? 'Yes' : 'No'}</span>
            <Label>Executed At:</Label>
            <span>{moment(watch('executedAt')).format('YYYY-MM-DD HH:mm:ss')}</span>
          </div>
          <DrawerFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || !isValid}
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (formRef.current?.submitForm) {
                  handleSubmit(formRef.current.submitForm)();
                }
              }}
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting && (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {' Submitting...'}
                </span>
              )}
              {!isSubmitting && 'Submit'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
});

export default DraftForm;
