import React, { useState } from 'react';

import { useAccountsWithDefaultOrder, useCategories } from '@/contexts/FinanceData';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';

interface Transaction {
  type: 'e' | 'i'
  amount: string
  category: string
  account: string
}

export const DraftForm: React.FC = () => {
  const { list: categories } = useCategories();
  const accounts = useAccountsWithDefaultOrder();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState<Partial<Transaction>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'amount' | 'category' | 'account'>('type');

  const handleSelect = (selectedValue: string) => {
    setTransaction(prev => ({ ...prev, [step]: selectedValue }));
    setInputValue('');
    moveToNextStep();
  };

  const moveToNextStep = () => {
    switch (step) {
      case 'type':
        setStep('amount');
        break;
      case 'amount':
        setStep('category');
        break;
      case 'category':
        setStep('account');
        break;
      case 'account':
        setIsModalOpen(true);
        break;
    }
  };

  const getCommandItems = () => {
    switch (step) {
      case 'type':
        return [
          { value: 'e', label: 'Expense' },
          { value: 'i', label: 'Income' }
        ];
      case 'category':
        return categories.map(category => ({ value: category.id, label: category.name }));
      case 'account':
        return accounts.map(account => ({ value: account.id, label: account.nameWithCurrency }));
      default:
        return [];
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setError('');
  };

  const handleInputSubmit = (currentInput: string) => {
    if (step === 'amount') {
      const amountRegex = /^\d+([.,]\d{1,2})?$/;
      if (!amountRegex.test(currentInput)) {
        setError('Invalid amount format. Please use numbers with up to two decimal places.');
        return;
      }
    }
    handleSelect(currentInput);
  };

  const resetTransaction = () => {
    setTransaction({});
    setStep('type');
    setInputValue('');
    setError('');
  };

  return (
    <div className="space-y-4">
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder={
            step === 'type' ? 'Select transaction type (e for expense, i for income)' :
              step === 'amount' ? 'Enter amount (e.g., 50.10)' :
                step === 'category' ? 'Select or enter category' :
                  step === 'account' && 'Select or enter account'
          }
          value={inputValue}
          onValueChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue) {
              e.preventDefault();
              handleInputSubmit(inputValue);
            }
          }}
        />
        <CommandList>
          <CommandEmpty>Press enter to submit '{inputValue}'</CommandEmpty>
          <CommandGroup heading={step.charAt(0).toUpperCase() + step.slice(1)}>
            {getCommandItems().map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={handleSelect}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Review your transaction details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Label>Type:</Label>
            <span>{transaction.type === 'e' ? 'Expense' : 'Income'}</span>
            <Label>Amount:</Label>
            <span>{transaction.amount}</span>
            <Label>Category:</Label>
            <span>{transaction.category}</span>
            <Label>Account:</Label>
            <span>{transaction.account}</span>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setIsModalOpen(false);
              resetTransaction();
            }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DraftForm;
