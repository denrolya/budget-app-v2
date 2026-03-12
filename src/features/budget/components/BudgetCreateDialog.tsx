import moment from 'moment';
import React, { useState } from 'react';

import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useCreateBudget } from '../api';
import type { BudgetDTO, BudgetPeriodType, CreateBudgetDTO } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgets: BudgetDTO[];
  onCreated?: (budget: BudgetDTO, fillFromHistory?: boolean) => void;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const BudgetCreateDialog: React.FC<Props> = ({ open, onOpenChange, budgets, onCreated }) => {
  const now = new Date();
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('monthly');
  const [name, setName] = useState('');
  const [copiedFromId, setCopiedFromId] = useState('');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(currentYear);
  const [yearOnly, setYearOnly] = useState(currentYear);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { mutateAsync, isPending } = useCreateBudget();

  const computeDates = (): { startDate: string; endDate: string } | null => {
    if (periodType === 'monthly') {
      const start = moment({ year, month });
      return {
        startDate: start.clone().startOf('month').format('YYYY-MM-DD'),
        endDate: start.clone().endOf('month').format('YYYY-MM-DD'),
      };
    }
    if (periodType === 'yearly') {
      return { startDate: `${yearOnly}-01-01`, endDate: `${yearOnly}-12-31` };
    }
    if (startDate && endDate) {
      return {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
      };
    }
    return null;
  };

  const isValid = () => periodType !== 'custom' || (!!startDate && !!endDate);

  const handleSubmit = async (fillFromHistory = false) => {
    const dates = computeDates();
    if (!dates) return;

    const payload: CreateBudgetDTO = {
      ...dates,
      periodType,
      name: name.trim() || undefined,
      copiedFromId: copiedFromId ? Number(copiedFromId) : undefined,
    };

    const budget = await mutateAsync(payload);
    onCreated?.(budget, fillFromHistory);
    onOpenChange(false);
    setName('');
    setCopiedFromId('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Budget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Period type */}
          <div className="space-y-2">
            <Label>Period type</Label>
            <RadioGroup
              value={periodType}
              className="flex gap-4"
              onValueChange={(v) => setPeriodType(v as BudgetPeriodType)}
            >
              {(['monthly', 'yearly', 'custom'] as BudgetPeriodType[]).map((pt) => (
                <div className="flex items-center gap-2" key={pt}>
                  <RadioGroupItem id={pt} value={pt} />
                  <Label htmlFor={pt} className="font-normal capitalize cursor-pointer">
                    {pt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Monthly: month + year pickers */}
          {periodType === 'monthly' && (
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label>Month</Label>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem value={String(i)} key={i}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 space-y-1">
                <Label>Year</Label>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem value={String(y)} key={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Yearly: year picker */}
          {periodType === 'yearly' && (
            <div className="w-32 space-y-1">
              <Label>Year</Label>
              <Select value={String(yearOnly)} onValueChange={(v) => setYearOnly(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem value={String(y)} key={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom: date range */}
          {periodType === 'custom' && (
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label>Start date</Label>
                <DatePicker date={startDate} label="Start date" setDate={setStartDate} />
              </div>
              <div className="flex-1 space-y-1">
                <Label>End date</Label>
                <DatePicker date={endDate} label="End date" setDate={setEndDate} />
              </div>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="budget-name">Name (optional)</Label>
            <Input
              id="budget-name"
              placeholder="e.g. Summer vacation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Copy from */}
          {budgets.length > 0 && (
            <div className="space-y-1">
              <Label>Copy lines from (optional)</Label>
              <Select value={copiedFromId} onValueChange={setCopiedFromId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((b) => (
                    <SelectItem value={String(b.id)} key={b.id}>
                      {b.name ?? `${b.startDate} – ${b.endDate}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!isValid() || isPending} variant="secondary" onClick={() => handleSubmit(true)}>
            {isPending ? 'Creating…' : 'Create & Fill'}
          </Button>
          <Button disabled={!isValid() || isPending} onClick={() => handleSubmit(false)}>
            {isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetCreateDialog;
