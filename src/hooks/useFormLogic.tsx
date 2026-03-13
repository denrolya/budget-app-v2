// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useEffect, useImperativeHandle, useRef } from 'react';
import { type FieldValues, type UseFormReturn, useFormState, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

export interface FormState<T> {
  isValid: boolean;
  isDirty: boolean;
  values: T;
}

export interface FormComponentRef {
  submitForm: () => Promise<void>;
}

interface UseFormLogicProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => Promise<void>;
  setFormState: (updates: Partial<FormState<T>>) => void;
}

export const useFormLogic = <T,>({ form, onSubmit, setFormState }: UseFormLogicProps<T>) => {
  const formRef = useRef<FormComponentRef>(null);

  useImperativeHandle(formRef, () => ({
    submitForm: async () => {
      const isValid = await form.trigger();
      if (isValid) {
        return form.handleSubmit(onSubmit)();
      } else {
        toast.error('Please fix the errors in the form', {
          action: {
            label: 'Close',
            onClick: () => toast.dismiss(),
          },
        });
        throw new Error('Form validation failed');
      }
    },
  }));

  const { isValid, isDirty } = useFormState({
    control: form.control,
  });

  const values = useWatch({
    control: form.control,
  });

  // Update formState whenever dependencies change
  useEffect(() => {
    setFormState({
      isValid,
      isDirty,
      values: values as T,
    });
  }, [isValid, isDirty, values, setFormState]);

  return { formRef };
};

export const createFormSchema = <T extends z.ZodRawShape>(schema: T) => z.object(schema);

export const defaultOnSubmit = async <T,>(_values: T) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
};
