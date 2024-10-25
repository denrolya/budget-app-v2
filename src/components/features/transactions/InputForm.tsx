import React, { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Transaction {
  type: 'e' | 'i'
  amount: number
  category: string
  executedAt?: Date
  note?: string
}

export const InputForm: React.FC = () => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string>('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const parseTransaction = (input: string): Transaction | null => {
    const regex = /^(e|i) (\d+([.,]\d{1,2})?) ([a-zA-Z]+)( \d{4}-\d{2}-\d{2})?( .+)?$/;
    const match = input.match(regex);

    if (!match) {
      throw new Error('Invalid format. Please use: <e|i> <amount> <category> [YYYY-MM-DD] [note]');
    }

    const [, type, amount, , category, date, note] = match;

    return {
      type: type as 'e' | 'i',
      amount: parseFloat(amount.replace(',', '.')),
      category,
      ...(date && { executedAt: new Date(date.trim()) }),
      ...(note && { note: note.trim() })
    };
  };

  const handleSubmit = () => {
    try {
      const parsedTransaction = parseTransaction(input);
      setTransaction(parsedTransaction);
      setError('');
      setIsModalOpen(true);
    } catch (err) {
      // @ts-expect-error FIXME: add correct type
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="e 50.00 Groceries [YYYY-MM-DD] [note]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
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
          {transaction && (
            <div className="grid grid-cols-2 gap-4">
              <Label>Type:</Label>
              <span>{transaction.type === 'e' ? 'Expense' : 'Income'}</span>
              <Label>Amount:</Label>
              <span>${transaction.amount.toFixed(2)}</span>
              <Label>Category:</Label>
              <span>{transaction.category}</span>
              {transaction.executedAt && (
                <>
                  <Label>Executed At:</Label>
                  <span>{transaction.executedAt.toLocaleDateString()}</span>
                </>
              )}
              {transaction.note && (
                <>
                  <Label>Note:</Label>
                  <span>{transaction.note}</span>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              setIsModalOpen(false);
              setInput('');
            }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InputForm;
