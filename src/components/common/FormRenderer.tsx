import { Loader2 } from 'lucide-react';
import React, { forwardRef, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useIsMobile } from '@/hooks/use-mobile';
import { AccountForm } from '@/features/accounts';
import { CategoryForm } from '@/features/categories';
import { DebtForm } from '@/features/debts';
import { BulkCreateTableForm, TransactionForm } from '@/features/transactions';
import { TransferForm } from '@/features/transfers';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { Separator } from '@/components/ui/separator';

type StandardFormType = Exclude<FormType, FormType.BulkTransaction>;

const formComponents: Record<StandardFormType, React.ComponentType<any>> = {
  [FormType.Account]: AccountForm,
  [FormType.Transaction]: TransactionForm,
  [FormType.Transfer]: TransferForm,
  [FormType.Debt]: DebtForm,
  [FormType.Category]: CategoryForm,
};

interface FormState {
  isValid: boolean;
  isDirty: boolean;
  values: any; // You might want to use a more specific type here
}

interface FormContentProps {
  formType: StandardFormType;
  values: any;
  onClose: () => void;
  setFormState: (updates: Partial<FormState>) => void;
  key: string;
}

const FormContent = forwardRef<{ submitForm: () => Promise<void> }, FormContentProps>((props, ref) => {
  const { key, formType } = props;
  const FormComponent = formComponents[formType];

  return <FormComponent key={key} ref={ref} />;
});

export const FormRenderer: React.FC = () => {
  const { formState, submitForm, closeForm, resetForm, updateFormState } = useFormContext();
  const formRef = useRef<{ submitForm: () => Promise<void> }>(null);
  const isMobile = useIsMobile();
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
          setFormKey((prev) => (parseInt(prev) + 1).toString());
        }
      } catch (error) {
        console.error('Form submission failed:', error);
        toast.error('Failed to submit form. Please try again.', {
          action: {
            label: 'Close',
            onClick: () => toast.dismiss(),
          },
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

  // BulkTransaction gets its own full-height bottom Drawer
  if (formState.type === FormType.BulkTransaction) {
    return (
      <Drawer open={formState.isOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[65vh] flex flex-col">
          <DrawerHeader className="shrink-0 border-b pb-3">
            <DrawerTitle>Bulk Create Transactions</DrawerTitle>
            <DrawerDescription className="sr-only">Create multiple transactions at once</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <BulkCreateTableForm />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const isEditMode = !!formState.values?.id;
  const title = `${isEditMode ? 'Edit' : 'New'} ${formState.type.charAt(0).toUpperCase() + formState.type.slice(1)}`;

  const content = (
    <FormContent
      formType={formState.type as StandardFormType}
      setFormState={updateFormState}
      values={formState.values}
      key={formKey}
      onClose={closeForm}
      ref={formRef}
    />
  );

  const footer = (
    <div className="flex justify-end space-x-2">
      <Button disabled={isLoading || !formState.isValid} type="submit" onClick={() => handleSubmit(false)}>
        {isEditMode ? 'Update' : 'Create'}
      </Button>
      <Button disabled={isLoading || !formState.isValid} type="button" onClick={() => handleSubmit(true)}>
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

  if (!isMobile) {
    return (
      <Dialog open={formState.isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">Form: {title}</DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter className="border-t pt-2">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={formState.isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="sr-only">Form: {title}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto">
          {content}
          <Separator className="h-1" />
          {footer}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
