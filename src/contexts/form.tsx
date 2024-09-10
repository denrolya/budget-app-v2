import { useState, useCallback, useContext, createContext, ReactNode } from 'react';

export enum FormType {
  Transaction = 'transaction',
  Transfer = 'transfer',
};

interface FormState {
  isOpen: boolean
  type: FormType | null
  data: any | null
  isEditing: boolean
}

export const useFormManager = () => {
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    type: null,
    data: null,
    isEditing: false,
  });

  const openForm = useCallback((type: FormType, data: any = null, isEditing: boolean = false) => {
    setFormState({ isOpen: true, type, data, isEditing });
  }, []);

  const closeForm = useCallback(() => {
    setFormState({ isOpen: false, type: null, data: null, isEditing: false });
  }, []);

  return { formState, openForm, closeForm };
};

const FormContext = createContext<ReturnType<typeof useFormManager> | undefined>(undefined);

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
