import {
  CalendarIcon,
  ChevronDownIcon,
  Edit2Icon,
  EyeIcon,
  FilterIcon,
  PlusIcon,
  SaveIcon,
  TrashIcon,
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Transaction = {
  id: number
  datetime: string
  account: string
  amount: number
  category: string
  note: string
  isDraft: boolean
}

type EditingField = {
  groupDate: string
  id: number
  field: keyof Transaction
} | null

export default function TransactionTable() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [includeNestedCategories, setIncludeNestedCategories] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [bulkTransactions, setBulkTransactions] = useState<Transaction[]>([
    {
      id: 1,
      datetime: new Date().toISOString().slice(0, 16),
      account: '',
      amount: 0,
      category: '',
      note: '',
      isDraft: false,
    },
  ]);
  const [editingField, setEditingField] = useState<EditingField>(null);

  // Mock data for demonstration
  const [transactions, setTransactions] = useState([
    {
      date: '2023-06-01', items: [
        {
          id: 1,
          datetime: '2023-06-01T09:30',
          account: 'Credit Card',
          amount: -5.50,
          category: 'Food',
          note: 'Morning coffee',
          isDraft: false,
        },
        {
          id: 2,
          datetime: '2023-06-01T12:45',
          account: 'Cash',
          amount: -15.00,
          category: 'Food',
          note: 'Lunch with colleagues',
          isDraft: true,
        },
        {
          id: 3,
          datetime: '2023-06-01T15:20',
          account: 'Debit Card',
          amount: -45.75,
          category: 'Work',
          note: 'Office supplies purchase',
          isDraft: false,
        },
      ],
    },
    {
      date: '2023-06-02', items: [
        {
          id: 4,
          datetime: '2023-06-02T10:00',
          account: 'Debit Card',
          amount: -75.20,
          category: 'Food',
          note: 'Weekly grocery shopping',
          isDraft: false,
        },
        {
          id: 5,
          datetime: '2023-06-02T14:30',
          account: 'Credit Card',
          amount: -40.00,
          category: 'Transport',
          note: 'Gas station fill-up',
          isDraft: true,
        },
      ],
    },
    {
      date: '2023-06-03', items: [
        {
          id: 6,
          datetime: '2023-06-03T09:15',
          account: 'Checking',
          amount: -1200.00,
          category: 'Housing',
          note: 'Monthly rent payment',
          isDraft: false,
        },
        {
          id: 7,
          datetime: '2023-06-03T11:45',
          account: 'Credit Card',
          amount: -50.00,
          category: 'Health',
          note: 'Gym membership fee',
          isDraft: false,
        },
        {
          id: 8,
          datetime: '2023-06-03T18:15',
          account: 'Credit Card',
          amount: -25.00,
          category: 'Entertainment',
          note: 'Movie night tickets',
          isDraft: true,
        },
      ],
    },
    {
      date: '2023-06-04', items: [
        {
          id: 9,
          datetime: '2023-06-04T08:30',
          account: 'Savings',
          amount: 3000.00,
          category: 'Income',
          note: 'Monthly salary deposit',
          isDraft: false,
        },
        {
          id: 10,
          datetime: '2023-06-04T13:20',
          account: 'Checking',
          amount: -65.00,
          category: 'Utilities',
          note: 'Phone bill payment',
          isDraft: false,
        },
      ],
    },
  ]);

  const addBulkTransaction = () => {
    const newId = bulkTransactions.length > 0 ? Math.max(...bulkTransactions.map(t => t.id)) + 1 : 1;
    setBulkTransactions([...bulkTransactions, {
      id: newId,
      datetime: new Date().toISOString().slice(0, 16),
      account: '',
      amount: 0,
      category: '',
      note: '',
      isDraft: false,
    }]);
  };

  const removeBulkTransaction = (id: number) => {
    setBulkTransactions(bulkTransactions.filter(t => t.id !== id));
  };

  const updateBulkTransaction = (id: number, field: keyof Transaction, value: any) => {
    setBulkTransactions(bulkTransactions.map(t =>
      t.id === id ? { ...t, [field]: value } : t,
    ));
  };

  const handleSaveBulkTransactions = () => {
    console.log('Saving bulk transactions:', bulkTransactions);
    // Here you would typically send the data to your backend
  };

  const startEditing = (groupDate: string, id: number, field: keyof Transaction) => {
    setEditingField({ groupDate, id, field });
  };

  const cancelEditing = () => {
    setEditingField(null);
  };

  const saveEditing = (value: any) => {
    if (editingField) {
      updateTransaction(editingField.groupDate, editingField.id, editingField.field, value);
      setEditingField(null);
    }
  };

  const updateTransaction = (groupDate: string, id: number, field: keyof Transaction, value: any) => {
    setTransactions(transactions.map(group =>
      group.date === groupDate
        ? {
          ...group,
          items: group.items.map(item =>
            item.id === id ? { ...item, [field]: value } : item,
          ),
        }
        : group,
    ));
  };

  const renderEditableCell = (groupDate: string, transaction: Transaction, field: keyof Transaction) => {
    const isEditing = editingField?.groupDate === groupDate && editingField?.id === transaction.id && editingField?.field === field;
    const value = transaction[field];

    if (isEditing) {
      switch (field) {
        case 'datetime':
          return (
            <Input
              type="datetime-local"
              value={value as string}
              onChange={(e) => saveEditing(e.target.value)}
              onBlur={() => cancelEditing()}
              autoFocus
            />
          );
        case 'account':
        case 'category':
          return (
            <Select
              value={value as string}
              onValueChange={(newValue) => saveEditing(newValue)}
              onOpenChange={(open) => !open && cancelEditing()}
            >
              <SelectTrigger>
                <SelectValue>{value as string}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {field === 'account' ? (
                  <>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit-card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          );
        case 'amount':
          return (
            <Input
              type="number"
              value={value as number}
              onChange={(e) => saveEditing(parseFloat(e.target.value))}
              onBlur={() => cancelEditing()}
              className="text-right"
              autoFocus
            />
          );
        case 'note':
          return (
            <Input
              type="text"
              value={value as string}
              onChange={(e) => saveEditing(e.target.value)}
              onBlur={() => cancelEditing()}
              autoFocus
            />
          );
        default:
          return null;
      }
    } else {
      return (
        <div
          className="cursor-pointer hover:bg-muted/50 p-1 rounded"
          onClick={() => startEditing(groupDate, transaction.id, field)}
        >
          {field === 'amount' ? (
            <span className={transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}>
              ${Math.abs(transaction.amount).toFixed(2)}
            </span>
          ) : field === 'category' ? (
            <Badge variant="outline" className="font-normal">
              {value as string}
            </Badge>
          ) : field === 'datetime' ? (
            new Date(value as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          ) : (
            value
          )}
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view">View Transactions</TabsTrigger>
          <TabsTrigger value="create">Bulk Create</TabsTrigger>
        </TabsList>
        <TabsContent value="view">
          <Card>
            <CardContent className="p-4">
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex-grow w-full sm:w-auto">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-[300px] justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                              </>
                            ) : (
                              dateRange.from.toLocaleDateString()
                            )
                          ) : (
                            <span>Select date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      Filters
                      <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select>
                        <SelectTrigger id="category" className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="housing">Housing</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="nested"
                          checked={includeNestedCategories}
                          onCheckedChange={(checked) => setIncludeNestedCategories(checked as boolean)}
                        />
                        <Label htmlFor="nested" className="text-sm">Include nested categories</Label>
                      </div>
                    </div>
                    <div>
                      <Label>Account</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="credit-card">Credit Card</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount Range</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input placeholder="Min" type="number" />
                        <Input placeholder="Max" type="number" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="draft"
                      checked={showDrafts}
                      onCheckedChange={(checked) => setShowDrafts(checked as boolean)}
                    />
                    <Label htmlFor="draft">Show draft transactions</Label>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="outline">Reset</Button>
                    <Button>Apply Filters</Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
            {/* Desktop view with click-to-edit functionality */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="w-[80px]">Time</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((group) => (
                    <React.Fragment key={group.date}>
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/50 font-medium py-1">
                          {group.date}
                        </TableCell>
                      </TableRow>
                      {group.items.filter(item => showDrafts || !item.isDraft).map((transaction) => (
                        <TableRow key={transaction.id} className={`h-12 ${transaction.isDraft ? 'bg-yellow-50' : ''}`}>
                          <TableCell className="py-1">{transaction.id}</TableCell>
                          <TableCell className="py-1">{renderEditableCell(group.date, transaction, 'account')}</TableCell>
                          <TableCell className="text-right py-1">{renderEditableCell(group.date, transaction, 'amount')}</TableCell>
                          <TableCell className="py-1">{renderEditableCell(group.date, transaction, 'category')}</TableCell>
                          <TableCell className="py-1">
                            {renderEditableCell(group.date, transaction, 'note')}
                            {transaction.isDraft && (
                              <Badge variant="secondary" className="ml-2">Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1">{renderEditableCell(group.date, transaction, 'datetime')}</TableCell>
                          <TableCell className="py-1">
                            <TooltipProvider>
                              <div className="flex space-x-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <EyeIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile view (unchanged) */}
            <div className="md:hidden">
              {transactions.map((group) => (
                <div key={group.date} className="mb-2">
                  <h3 className="bg-muted/50 font-medium py-2 px-4">{group.date}</h3>
                  {group.items.filter(item => showDrafts || !item.isDraft).map((transaction) => (
                    <div key={transaction.id} className={`border-b p-2 ${transaction.isDraft ? 'bg-yellow-50' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{transaction.note}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{new Date(transaction.datetime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}</span>
                            <Badge variant="outline" className="font-normal">
                              {transaction.category}
                            </Badge>
                            {transaction.isDraft && (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ${Math.abs(transaction.amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">{transaction.account}</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-2 space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit2Icon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Show</span>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">entries</span>
            </div>

            <div className="text-sm text-gray-500">
              Showing 1 to {pageSize} of 100 entries
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                Previous
              </Button>
              <Input
                type="number"
                min={1}
                max={10}
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="w-16 h-8 text-center"
              />
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(10, currentPage + 1))}>
                Next
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="create">
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Input
                          type="datetime-local"
                          value={transaction.datetime}
                          onChange={(e) => updateBulkTransaction(transaction.id, 'datetime', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.account}
                          onValueChange={(value) => updateBulkTransaction(transaction.id, 'account', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="credit-card">Credit Card</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.category}
                          onValueChange={(value) => updateBulkTransaction(transaction.id, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="housing">Housing</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={transaction.amount}
                          onChange={(e) => updateBulkTransaction(transaction.id, 'amount', parseFloat(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Note"
                          value={transaction.note}
                          onChange={(e) => updateBulkTransaction(transaction.id, 'note', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBulkTransaction(transaction.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between mt-4">
                <Button onClick={addBulkTransaction}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
                <Button onClick={handleSaveBulkTransactions}>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
