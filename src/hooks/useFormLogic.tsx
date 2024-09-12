import { useEffect, useImperativeHandle, useRef } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

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
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const useFormLogic = <T,>({
                                   form,
                                   onSubmit,
                                   setFormState,
                                   showToast,
                                 }: UseFormLogicProps<T>) => {
  const formRef = useRef<FormComponentRef>(null);

  useImperativeHandle(formRef, () => ({
    submitForm: async () => {
      const isValid = await form.trigger();
      if (isValid) {
        return form.handleSubmit(onSubmit)();
      } else {
        showToast('Please fix the errors in the form', 'error');
        throw new Error('Form validation failed');
      }
    },
  }));

  useEffect(() => {
    const subscription = form.watch((value) => {
      setFormState((prevState) => ({
        ...prevState,
        isValid: form.formState.isValid,
        isDirty: form.formState.isDirty,
        values: value as T,
      }));
    });
    return () => subscription.unsubscribe();
  }, [form, setFormState]);

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
