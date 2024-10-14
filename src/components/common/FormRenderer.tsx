import { Loader2 } from 'lucide-react';
import React, { forwardRef, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useScreenSize } from '@/hooks/useScreenSize';
import AccountForm from '@/components/features/accounts/Form';
import TransactionForm from '@/components/features/transactions/Form';
import TransferForm from '@/components/features/transfers/Form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { Separator } from '@/components/ui/separator';

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
  values: any;
  onClose: () => void;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  key: string;
}

const FormContent = forwardRef<{ submitForm: () => Promise<void> }, FormContentProps>((props, ref) => {
  const { key, formType } = props;
  const FormComponent = formComponents[formType];

  return (
    <FormComponent ref={ref} key={key} />
  );
});

export const FormRenderer: React.FC = () => {
  const { formState, submitForm, closeForm, resetForm, updateFormState } = useFormContext();
  const formRef = useRef<{ submitForm: () => Promise<void> }>(null);
  const isDesktop = useScreenSize();
  const [formKey, setFormKey] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (shouldClose = true) => {
    if (formRef.current) {
      setIsLoading(true);
      try {
        await formRef.current.submitForm();
        submitForm(formState.values);
        if (shouldClose) {
          closeForm();
        } else {
          resetForm();
          setFormKey(prev => (parseInt(prev) + 1).toString());
        }
      } catch (error) {
        console.error('Form submission failed:', error);
        toast.error('Failed to submit form. Please try again.', {
          action: {
            label: 'Close',
            onClick: () => toast.dismiss()
          }
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && formState.isOpen) {
      closeForm();
    }
  };

  if (!formState.type) return null;

  const isEditMode = !!formState.values?.id;
  const title = `${isEditMode ? 'Edit' : 'New'} ${formState.type.charAt(0).toUpperCase() + formState.type.slice(1)}`;

  const content = (
    <FormContent
      ref={formRef}
      formType={formState.type as FormType}
      values={formState.values}
      onClose={closeForm}
      setFormState={updateFormState}
      key={formKey}
    />
  );

  const footer = (
    <div className="flex justify-end space-x-2">
      <Button
        type="submit"
        onClick={() => handleSubmit(false)}
        disabled={isLoading || !formState.isValid}
      >
        {isEditMode ? 'Update' : 'Create'}
      </Button>
      <Button
        type="button"
        onClick={() => handleSubmit(true)}
        disabled={isLoading || !formState.isValid}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditMode ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          `${isEditMode ? 'Update' : 'Create'} & Close`
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={formState.isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {content}
          <DialogFooter className="border-t pt-2">
            {footer}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={formState.isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto">
          {content}
          <Separator className="h-1"  />
          {footer}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
