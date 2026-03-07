import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export enum FormType {
  Transaction = 'transaction',
  Transfer = 'transfer',
  Account = 'account',
  Debt = 'debt',
  Category = 'category',
}

interface FormState {
  isOpen: boolean;
  type: FormType | null;
  values: any | null;
  isValid: boolean;
  isDirty: boolean;
}

type FormEventListener<T = any> = (formType: FormType, response: T) => void;

interface FormContextType {
  formState: FormState;
  openForm: (type: FormType, initialValues?: any) => void;
  closeForm: () => void;
  submitForm: (values: any) => void;
  updateFormState: (updates: Partial<FormState>) => void;
  resetForm: () => void;
  addFormSubmitListener: <T>(listener: FormEventListener<T>) => void;
  removeFormSubmitListener: <T>(listener: FormEventListener<T>) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

const initialFormState: FormState = {
  isOpen: false,
  type: null,
  values: null,
  isValid: false,
  isDirty: false,
};

export const useFormManager = (): FormContextType => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [listeners, setListeners] = useState<FormEventListener[]>([]);

  const openForm = useCallback((type: FormType, initialValues: any = null) => {
    setFormState({
      isOpen: true,
      type,
      values: initialValues,
      isValid: false,
      isDirty: false,
    });
  }, []);

  const closeForm = useCallback(() => {
    setFormState(initialFormState);
  }, []);

  const submitForm = useCallback(
    <T,>(response: T) => {
      if (formState.type) {
        listeners.forEach((listener) => listener(formState.type!, response));
      }
    },
    [formState.type, listeners, closeForm],
  );

  const resetForm = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      isValid: false,
      isDirty: false,
      values: initialFormState.values,
    }));
  }, []);

  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  const addFormSubmitListener = useCallback(<T,>(listener: FormEventListener<T>) => {
    setListeners((prev) => [...prev, listener as FormEventListener]);
  }, []);

  const removeFormSubmitListener = useCallback(<T,>(listener: FormEventListener<T>) => {
    setListeners((prev) => prev.filter((l) => l !== listener));
  }, []);

  return {
    formState,
    openForm,
    closeForm,
    submitForm,
    updateFormState,
    resetForm,
    addFormSubmitListener,
    removeFormSubmitListener,
  };
};

export const FormProvider = ({ children }: { children: React.ReactNode }) => {
  const formManager = useFormManager();

  return <FormContext.Provider value={formManager}>{children}</FormContext.Provider>;
};

export const useForm = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

export const useFormSubmitListener = <T,>(formTypes: FormType[], callback: (response: T) => void) => {
  const { addFormSubmitListener, removeFormSubmitListener } = useForm();

  // Memoize formTypes and callback
  const memoizedFormTypes = useMemo(
    () => formTypes,
    [
      /* actual dependencies */
    ],
  );
  // const memoizedCallback = useCallback(callback, [/* actual dependencies */]);

  useEffect(() => {
    const listener: FormEventListener<T> = (formType, response) => {
      if (memoizedFormTypes.includes(formType)) {
        callback(response);
      }
    };
    addFormSubmitListener(listener);
    return () => removeFormSubmitListener(listener);
  }, [memoizedFormTypes, callback, addFormSubmitListener, removeFormSubmitListener]);
};
