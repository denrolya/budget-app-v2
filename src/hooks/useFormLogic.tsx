import { useEffect, useImperativeHandle, useRef } from 'react';
import { FieldValues, UseFormReturn, useFormState, useWatch } from 'react-hook-form';
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
  setFormState: React.Dispatch<React.SetStateAction<FormState<T>>>;
}

export const useFormLogic = <T,>({ form, onSubmit, setFormState }: UseFormLogicProps<T>) => {
  const formRef = useRef<FormComponentRef>(null);

  useImperativeHandle(formRef, () => ({
    submitForm: async () => {
      const isValid = await form.trigger();
      if (isValid) {
        return form.handleSubmit(onSubmit)();
      } else {
        toast.error('Please fix the errors in the form');
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

export const defaultOnSubmit = async <T,>(values: T) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Form submitted:', values);
    // Perform your actual form submission logic here
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error; // Re-throw the error to be caught by the form renderer
  }
};
