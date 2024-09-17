import React, { FC, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AccountForm } from '@/components/features/accounts/Form';
import TransactionForm from '@/components/features/transactions/Form';
import { TransferForm } from '@/components/features/transfers/Form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { FormType, useForm } from '@/contexts/Form';

const formComponents = {
  [FormType.Account]: AccountForm,
  [FormType.Transaction]: TransactionForm,
  [FormType.Transfer]: TransferForm,
  // [FormType.Debt]: DebtForm,
  // [FormType.Category]: CategoryForm,
};

type FormType = keyof typeof formComponents;

interface FormState {
  isValid: boolean;
  isDirty: boolean;
  values: any; // You might want to use a more specific type here
}

interface FormContentProps {
  formType: FormType;
  isEditing: boolean;
  data: any;
  onClose: (submitted: boolean) => void;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const FormContent = React.forwardRef<{ submitForm: () => Promise<void> }, FormContentProps>((props, ref) => {
  const { formType, isEditing, data, onClose, setFormState, showToast } = props;
  const FormComponent = formComponents[formType];

  return (
    <FormComponent
      ref={ref}
      data={data}
      isEditing={isEditing}
      onClose={onClose}
      setFormState={setFormState}
      showToast={showToast}
    />
  );
});

const useScreenSize = () => {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768); // Adjust this breakpoint as needed
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isDesktop;
};

export const FormRenderer: FC = () => {
  const { formState: contextFormState, closeForm } = useForm();
  const formRef = useRef<{ submitForm: () => Promise<void> }>(null);
  const isDesktop = useScreenSize();

  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    isValid: false,
    isDirty: false,
    values: contextFormState.data,
  });

  const handleSubmit = async () => {
    if (formRef.current) {
      setIsLoading(true);
      try {
        await formRef.current.submitForm();
        toast.success('Form submitted successfully!');
        closeForm(true);
      } catch (error) {
        console.error('Form submission failed:', error);
        toast.error('Failed to submit form. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && contextFormState.isOpen) {
      handleClose(false);
    }
  };

  const handleClose = (submitted: boolean) => {
    closeForm(submitted);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    toast[type](message);
  };

  if (!contextFormState.type) return null;

  const title = `${contextFormState.isEditing ? 'Edit' : 'New'} ${contextFormState.type.charAt(0).toUpperCase() + contextFormState.type.slice(1)}`;
  const description = `${contextFormState.isEditing ? 'Edit' : 'Add'} a ${contextFormState.type} in your finances`;

  const content = (
    <FormContent
      ref={formRef}
      formType={contextFormState.type as FormType}
      isEditing={contextFormState.isEditing}
      data={contextFormState.data}
      onClose={handleClose}
      setFormState={setFormState}
      showToast={showToast}
    />
  );

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={handleClose}>
        Cancel
      </Button>
      <Button
        type="submit"
        onClick={handleSubmit}
        disabled={isLoading || !formState.isValid}
      >
        {isLoading ? 'Submitting...' : contextFormState.isEditing ? 'Update' : 'Create'}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={contextFormState.isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter className="border-t">
            {footer}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={contextFormState.isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="h-[80vh] flex flex-col">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="flex-grow overflow-y-auto px-4 pb-4">
          {content}
        </div>
        <DrawerFooter className="p-4 border-t">
          {footer}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
