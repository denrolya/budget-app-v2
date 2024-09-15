import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export enum FormType {
  Transaction = 'transaction',
  Transfer = 'transfer',
  Account = 'account',
  Debt = 'debt',
  Category = 'category'
}

interface FormState {
  isOpen: boolean;
  type: FormType | null;
  data: any | null;
  isEditing: boolean;
}

type FormEventListener<T = any> = (formType: FormType, response: T) => void;

interface FormContextType {
  formState: FormState;
  openForm: (type: FormType, data?: any, isEditing?: boolean) => void;
  closeForm: () => void;
  submitForm: <T>(response: T) => void;
  addFormSubmitListener: <T>(listener: FormEventListener<T>) => void;
  removeFormSubmitListener: <T>(listener: FormEventListener<T>) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormManager = (): FormContextType => {
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    type: null,
    data: null,
    isEditing: false,
  });
  const [listeners, setListeners] = useState<FormEventListener[]>([]);

  const openForm = useCallback((type: FormType, data: any = null, isEditing: boolean = false) => {
    setFormState({ isOpen: true, type, data, isEditing });
  }, []);

  const closeForm = useCallback(() => {
    setFormState({ isOpen: false, type: null, data: null, isEditing: false });
  }, []);

  const submitForm = useCallback(<T,>(response: T) => {
    if (formState.type) {
      listeners.forEach(listener => listener(formState.type!, response));
    }
    closeForm();
  }, [formState.type, listeners, closeForm]);

  const addFormSubmitListener = useCallback(<T,>(listener: FormEventListener<T>) => {
    setListeners(prev => [...prev, listener as FormEventListener]);
  }, []);

  const removeFormSubmitListener = useCallback(<T,>(listener: FormEventListener<T>) => {
    setListeners(prev => prev.filter(l => l !== listener));
  }, []);

  return {
    formState,
    openForm,
    closeForm,
    submitForm,
    addFormSubmitListener,
    removeFormSubmitListener
  };
};

export const FormProvider = ({ children }: { children: ReactNode }) => {
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

  useEffect(() => {
    const listener: FormEventListener<T> = (formType, response) => {
      if (formTypes.includes(formType)) {
        callback(response);
      }
    };
    addFormSubmitListener(listener);
    return () => removeFormSubmitListener(listener);
  }, [formTypes, callback, addFormSubmitListener, removeFormSubmitListener]);
};
