import { Loader2 } from 'lucide-react';
import React, { forwardRef, useRef, useState } from 'react';
import { toast } from 'sonner';

import { capitalize } from '@/lib/capitalize';
import { useIsMobile } from '@/hooks/use-mobile';
import { AccountForm } from '@/features/accounts';
import { logger } from '@/services/DebugLogger';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  values: unknown;
}

interface FormContentProps {
  formType: StandardFormType;
  values: unknown;
  onClose: () => void;
  setFormState: (updates: Partial<FormState>) => void;
}

const FormContent = forwardRef<{ submitForm: () => Promise<void> }, FormContentProps>((props, ref) => {
  const { formType } = props;
  const FormComponent = formComponents[formType];

  return <FormComponent ref={ref} />;
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
        logger.error(error, 'FormRenderer');
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
        <DrawerContent className="h-[85vh] flex flex-col">
          {/* Title kept for screen readers only — form has its own terminal command bar */}
          <DrawerHeader className="sr-only">
            <DrawerTitle>Bulk Create Transactions</DrawerTitle>
            <DrawerDescription>Create multiple transactions at once</DrawerDescription>
          </DrawerHeader>
          <div data-vaul-no-drag className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <BulkCreateTableForm />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const isEditMode = !!(formState.values as Record<string, unknown>)?.id;
  const title = `${isEditMode ? 'Edit' : 'New'} ${capitalize(formState.type)}`;

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
    <div className="flex justify-end gap-2">
      <Button disabled={isLoading || !formState.isValid} size="sm" type="submit" variant="outline" onClick={() => handleSubmit(false)}>
        {isEditMode ? 'Update' : 'Create'}
      </Button>
      <Button disabled={isLoading || !formState.isValid} size="sm" type="button" onClick={() => handleSubmit(true)}>
        {isLoading ? (
          <>
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-visible gap-0">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">{title}</DialogTitle>
            <DialogDescription className="sr-only">Form: {title}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-9rem)] overflow-y-auto pr-1">{content}</div>
          <DialogFooter className="border-t pt-1.5 mt-2">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={formState.isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left pb-1">
          <DrawerTitle className="text-base">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">Form: {title}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-3 overflow-y-auto">
          {content}
          <Separator className="my-1.5" />
          {footer}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
