import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { toast } from 'sonner';

import { AccountForm } from '@/components/features/accounts/Form';
import TransactionForm from '@/components/features/transactions/Form';
import { TransferForm } from '@/components/features/transfers/Form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { FormType, useForm as useFormContext } from '@/contexts/Form';

const formComponents = {
  [FormType.Account]: AccountForm,
  [FormType.Transaction]: TransactionForm,
  [FormType.Transfer]: TransferForm,
  // [FormType.Debt]: DebtForm,
  // [FormType.Category]: CategoryForm,
};

interface FormState {
  isValid: boolean;
  isDirty: boolean;
  values: any; // You might want to use a more specific type here
}

interface FormContentProps {
  formType: FormType;
  data: any;
  onClose: (submitted: boolean) => void;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
}

const FormContent = forwardRef<{ submitForm: () => Promise<void> }, FormContentProps>((props, ref) => {
  const { formType, data, onClose, setFormState } = props;
  const FormComponent = formComponents[formType];

  return (
    <FormComponent
      ref={ref}
      data={data}
      onClose={onClose}
      setFormState={setFormState}
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

export const FormRenderer: React.FC = () => {
  const { formState: contextFormState, closeForm } = useFormContext();
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

  if (!contextFormState.type) return null;

  const title = `${contextFormState.data?.id ? 'Edit' : 'New'} ${contextFormState.type.charAt(0).toUpperCase() + contextFormState.type.slice(1)}`;

  const content = (
    <FormContent
      ref={formRef}
      formType={contextFormState.type as FormType}
      data={contextFormState.data}
      onClose={handleClose}
      setFormState={setFormState}
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
        {isLoading ? 'Submitting...' : contextFormState.data?.id ? 'Update' : 'Create'}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={contextFormState.isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
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
      <DrawerContent className="max-h-[80vh] overflow-y-auto">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          {content}
        </div>
        <DrawerFooter className="p-4 border-t">
          {footer}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
