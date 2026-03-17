import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export enum FormType {
  Transaction = 'transaction',
  Transfer = 'transfer',
  Account = 'account',
  Debt = 'debt',
  Category = 'category',
  BulkTransaction = 'bulk-transaction',
}

interface FormState {
  isOpen: boolean;
  type: FormType | null;
  values: unknown;
  isValid: boolean;
  isDirty: boolean;
}

type FormEventListener<T = unknown> = (formType: FormType, response: T) => void;

interface FormContextType {
  formState: FormState;
  openForm: (type: FormType, initialValues?: unknown) => void;
  closeForm: () => void;
  submitForm: (values: unknown) => void;
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

// eslint-disable-next-line react-refresh/only-export-components
export const useFormManager = (): FormContextType => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const listenersRef = useRef<FormEventListener[]>([]);
  const formStateRef = useRef(formState);
  formStateRef.current = formState;

  const openForm = useCallback((type: FormType, initialValues: unknown = null) => {
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

  const submitForm = useCallback(<T,>(response: T) => {
    if (formStateRef.current.type) {
      listenersRef.current.forEach((listener) => listener(formStateRef.current.type!, response));
    }
  }, []);

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
    listenersRef.current = [...listenersRef.current, listener as FormEventListener];
  }, []);

  const removeFormSubmitListener = useCallback(<T,>(listener: FormEventListener<T>) => {
    listenersRef.current = listenersRef.current.filter((l) => l !== listener);
  }, []);

  return useMemo(
    () => ({
      formState,
      openForm,
      closeForm,
      submitForm,
      updateFormState,
      resetForm,
      addFormSubmitListener,
      removeFormSubmitListener,
    }),
    [
      formState,
      openForm,
      closeForm,
      submitForm,
      updateFormState,
      resetForm,
      addFormSubmitListener,
      removeFormSubmitListener,
    ],
  );
};

export const FormProvider = ({ children }: { children: React.ReactNode }) => {
  const formManager = useFormManager();

  return <FormContext.Provider value={formManager}>{children}</FormContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useForm = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFormSubmitListener = <T,>(formTypes: FormType[], callback: (response: T) => void) => {
  const { addFormSubmitListener, removeFormSubmitListener } = useForm();

  // Stabilize formTypes by serializing — callers pass inline arrays
  const typesKey = formTypes.join(',');
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const types = typesKey.split(',') as FormType[];
    const listener: FormEventListener<T> = (formType, response) => {
      if (types.includes(formType)) {
        callbackRef.current(response);
      }
    };
    addFormSubmitListener(listener);
    return () => removeFormSubmitListener(listener);
  }, [typesKey, addFormSubmitListener, removeFormSubmitListener]);
};
