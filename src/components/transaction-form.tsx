import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const categories = [
  { id: 1, name: 'Groceries', rootCategory: 'Food', icon: '🍎' },
  { id: 2, name: 'Restaurants', rootCategory: 'Food', icon: '🍽️' },
  { id: 3, name: 'Rent', rootCategory: 'Housing', icon: '🏠' },
  { id: 4, name: 'Utilities', rootCategory: 'Housing', icon: '💡' },
  { id: 5, name: 'Salary', rootCategory: 'Income', icon: '💼' },
];

const accounts = [
  { id: 1, name: 'Main Checking', currency: 'USD', icon: '🏦' },
  { id: 2, name: 'Savings', currency: 'USD', icon: '💰' },
  { id: 3, name: 'Credit Card', currency: 'USD', icon: '💳' },
];

export default function TransactionForm() {
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [compensations, setCompensations] = useState([{ amount: '', account: '', date: '' }]);

  const handleCompensationChange = (index: number, field: string, value: string) => {
    const newCompensations = [...compensations];
    newCompensations[index] = { ...newCompensations[index], [field]: value };
    setCompensations(newCompensations);
  };

  const addCompensation = () => {
    setCompensations([...compensations, { amount: '', account: '', date: '' }]);
  };

  const removeCompensation = (index: number) => {
    const newCompensations = compensations.filter((_, i) => i !== index);
    setCompensations(newCompensations);
  };
  // <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
  //                     {[
  //                       { value: 'internet', label: 'Internet', icon: CreditCard },
  //                       { value: 'bank', label: 'Bank', icon: Wallet },
  //                       { value: 'cash', label: 'Cash', icon: Banknote },
  //                       { value: 'other', label: 'Other', icon: MoreHorizontal },
  //                     ].map((option) => (
  //                       <Button
  //                         key={option.value}
  //                         type="button"
  //                         variant={field.value === option.value ? 'default' : 'outline'}
  //                         className={cn('h-20', {
  //                           'ring-2 ring-primary': field.value === option.value,
  //                         })}
  //                         onClick={() => {
  //                           field.onChange(option.value);
  //                           setAccountType(option.value);
  //                         }}
  //                       >
  //                         <div className="flex flex-col items-center justify-center space-y-2">
  //                           <option.icon className="w-6 h-6" />
  //                           <span>{option.label}</span>
  //                         </div>
  //                       </Button>
  //                     ))}
  //                   </div>

  return (
    <div className="w-full max-w-md bg-background text-foreground">
      <form className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="transaction-type">Type</Label>
            <RadioGroup id="transaction-type" value={type} onValueChange={setType} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense">Expense</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income">Income</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="date-select">Date & Time</Label>
            <Input
              id="date-select"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="category-select">Category</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="category-select"
                variant="outline"
                role="combobox"
                aria-expanded="false"
                className="w-full justify-between"
              >
                {category
                  ? categories.find((cat) => cat.name === category)?.name
                  : 'Select category...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    {categories.map((cat) => (
                      <CommandItem key={cat.id} onSelect={() => setCategory(cat.name)}>
                        <Check className={cn(
                          'mr-2 h-4 w-4',
                          category === cat.name ? 'opacity-100' : 'opacity-0',
                        )} />
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                        <span className="ml-auto text-muted-foreground">{cat.rootCategory}</span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="account-select">Account</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="account-select"
                variant="outline"
                role="combobox"
                aria-expanded="false"
                className="w-full justify-between"
              >
                {account
                  ? accounts.find((acc) => acc.name === account)?.name
                  : 'Select account...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search account..." />
                <CommandEmpty>No account found.</CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    {accounts.map((acc) => (
                      <CommandItem key={acc.id} onSelect={() => setAccount(acc.name)}>
                        <Check className={cn(
                          'mr-2 h-4 w-4',
                          account === acc.name ? 'opacity-100' : 'opacity-0',
                        )} />
                        <span className="mr-2">{acc.icon}</span>
                        {acc.name}
                        <span className="ml-auto text-muted-foreground">{acc.currency}</span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="h-20"
          />
        </div>

        {type === 'expense' && (
          <div>
            <Label>Compensations</Label>
            {compensations.map((comp, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 mt-2 p-2 border border-border rounded-md">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={comp.amount}
                  onChange={(e) => handleCompensationChange(index, 'amount', e.target.value)}
                  aria-label={`Compensation ${index + 1} Amount`}
                  className="w-24 flex-grow"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded="false"
                      className="w-32 flex-grow justify-between"
                    >
                      {comp.account
                        ? accounts.find((acc) => acc.name === comp.account)?.name
                        : 'Account'}
                      <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search account..." />
                      <CommandEmpty>No account found.</CommandEmpty>
                      <CommandGroup>
                        {accounts.map((acc) => (
                          <CommandItem
                            key={acc.id}
                            onSelect={() => handleCompensationChange(index, 'account', acc.name)}
                          >
                            <Check className={cn(
                              'mr-2 h-4 w-4',
                              comp.account === acc.name ? 'opacity-100' : 'opacity-0',
                            )} />
                            <span className="mr-2">{acc.icon}</span>
                            {acc.name}
                            <span className="ml-auto text-muted-foreground">{acc.currency}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  type="datetime-local"
                  value={comp.date}
                  onChange={(e) => handleCompensationChange(index, 'date', e.target.value)}
                  aria-label={`Compensation ${index + 1} Date & Time`}
                  className="w-40 flex-grow"
                />
                <Button
                  variant="destructive"
                  onClick={() => removeCompensation(index)}
                  className="p-2 h-9 w-9"
                  aria-label="Remove compensation"
                >
                  X
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addCompensation} className="mt-2 w-full">
              Add Compensation
            </Button>
          </div>
        )}

        <Button type="submit" className="w-full">Submit</Button>
      </form>
    </div>
  );
}
