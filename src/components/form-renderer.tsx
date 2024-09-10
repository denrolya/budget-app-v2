import { TransactionForm } from '@/components/transaction-form';
import { TransferForm } from '@/components/transfer-form';
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
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useForm } from '@/contexts/form';
import React, { useEffect, useState } from 'react';

const formComponents = {
  transaction: TransactionForm,
  transfer: TransferForm,
};

export const FormRenderer = () => {
  const { formState, closeForm } = useForm();
  const formRef = React.useRef<{ submitForm: () => void }>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  const FormComponent = formState.type ? formComponents[formState.type] : null;
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFormValid, setIsFormValid] = React.useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768); // Adjust this breakpoint as needed
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSubmit = async () => {
    if (formRef.current) {
      setIsLoading(true);
      await formRef.current.submitForm();
      setIsLoading(false);
      closeForm();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && formState.isOpen) {
      handleClose();
    }
  };

  const handleClose = () => {
    // You might want to show a confirmation dialog here if the form is dirty
    closeForm();
  };

  const content = FormComponent ? (
    <FormComponent
      ref={formRef}
      data={formState.data}
      isEditing={formState.isEditing}
      onClose={closeForm}
      setIsFormValid={setIsFormValid}
    />
  ) : null;

  const title = formState.type
    ? `${formState.isEditing ? 'Edit' : 'New'} ${formState.type.charAt(0).toUpperCase() + formState.type.slice(1)}`
    : '';
  const description = `${formState.isEditing ? 'Edit' : 'Add'} a ${formState.type} in your finances`;

  if (isDesktop) {
    return (
      <Dialog open={formState.isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter className="border-t">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? 'Submitting...' : formState.isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
  //   <DialogHeader>
  //     <DialogTitle>New Transaction</DialogTitle>
  //     <DialogDescription>
  //       Add a new transaction to your finances
  //     </DialogDescription>
  //   </DialogHeader>
  //   <TransactionForm
  //     ref={formRef}
  //     onSubmit={handleSubmit}
  //     onFormStateChange={setIsFormValid}
  //   />
  //   <DialogFooter>
  //     <Button
  //       type="submit"
  //       onClick={() => formRef.current?.submitForm()}
  //       disabled={isLoading || !isFormValid}
  //       className="w-full"
  //     >
  //       {isLoading ? 'Submitting...' : 'Submit'}
  //     </Button>
  //   </DialogFooter>
  // </DialogContent>

  return (
    <Drawer open={formState.isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="h-[80vh] flex flex-col">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="flex-grow overflow-y-auto px-4 pb-4">
          {content}
        </div>
        <DrawerFooter className="p-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={closeForm}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? 'Submitting...' : formState.isEditing ? 'Update' : 'Create'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
