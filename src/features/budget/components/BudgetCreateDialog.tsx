import { TrendingDown, TrendingUp } from 'lucide-react';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useValueByPeriodStatisticsRequest } from '@/hooks/statistics/useValueByPeriodStatisticsRequest';

import { useCreateBudget } from '../api';
import type { BudgetDTO, BudgetPeriodType, CreateBudgetDTO } from '../api/types';
import { formatBudgetAmount } from '../utils';

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

// ── Prediction preview panel ────────────────────────────────────────────────

const PredictionPreview: React.FC<{ periodType: BudgetPeriodType; month: number; year: number }> = ({
  periodType,
  month,
  year,
}) => {
  const lookbackMonths = periodType === 'monthly' ? 6 : 12;
  const after = useMemo(
    () =>
      moment()
        .subtract(lookbackMonths - 1, 'months')
        .startOf('month'),
    [lookbackMonths],
  );
  const before = useMemo(() => moment().endOf('month'), []);

  const { data, isLoading } = useValueByPeriodStatisticsRequest({
    after,
    before,
    period: 'P1M',
    queryKey: `budget-create-preview-${lookbackMonths}`,
  });

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const nonZeroExpense = data.filter((d) => d.expense > 0);
    const nonZeroIncome = data.filter((d) => d.income > 0);

    const avgExpense =
      nonZeroExpense.length > 0
        ? Math.round(nonZeroExpense.reduce((s, d) => s + d.expense, 0) / nonZeroExpense.length)
        : 0;
    const avgIncome =
      nonZeroIncome.length > 0 ? Math.round(nonZeroIncome.reduce((s, d) => s + d.income, 0) / nonZeroIncome.length) : 0;

    // Simple trend: compare last 3 months vs prior 3 months
    const recentData = data.slice(-3);
    const olderData = data.slice(-6, -3);

    let trendPercent = 0;
    if (olderData.length >= 2 && recentData.length >= 2) {
      const olderAvg = olderData.reduce((s, d) => s + d.expense, 0) / olderData.length;
      const recentAvg = recentData.reduce((s, d) => s + d.expense, 0) / recentData.length;
      if (olderAvg > 0) {
        trendPercent = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
      }
    }

    // Scale to budget period
    const budgetDays =
      periodType === 'yearly' ? (moment({ year }).isLeapYear() ? 366 : 365) : moment({ year, month }).daysInMonth();
    const scaleFactor = budgetDays / 30;

    return {
      expense: Math.round(avgExpense * scaleFactor),
      income: Math.round(avgIncome * scaleFactor),
      savings: Math.round((avgIncome - avgExpense) * scaleFactor),
      trendPercent,
    };
  }, [data, periodType, month, year]);

  if (isLoading || !stats) return null;

  const TrendIcon = stats.trendPercent > 0 ? TrendingUp : TrendingDown;
  const hasTrend = Math.abs(stats.trendPercent) >= 10;

  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1.5">
      <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
        Estimate based on {lookbackMonths}mo history
      </p>
      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="text-2xs text-muted-foreground mr-1">Expenses</span>
          <span className="font-medium text-destructive tabular-nums">{formatBudgetAmount(stats.expense, 'EUR')}</span>
        </div>
        <div>
          <span className="text-2xs text-muted-foreground mr-1">Income</span>
          <span className="font-medium text-success tabular-nums">{formatBudgetAmount(stats.income, 'EUR')}</span>
        </div>
        <div>
          <span className="text-2xs text-muted-foreground mr-1">Savings</span>
          <span className={cn('font-medium tabular-nums', { 'text-success': stats.savings >= 0, 'text-destructive': stats.savings < 0 })}>
            {formatBudgetAmount(stats.savings, 'EUR')}
          </span>
        </div>
      </div>
      {hasTrend && (
        <p className={cn('text-2xs inline-flex items-center gap-0.5', { 'text-destructive': stats.trendPercent > 0, 'text-success': stats.trendPercent <= 0 })}>

          <TrendIcon className="h-2.5 w-2.5" />
          Expenses trending {stats.trendPercent > 0 ? 'up' : 'down'} {Math.abs(stats.trendPercent)}%
        </p>
      )}
    </div>
  );
};

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

          {/* Prediction preview */}
          {periodType !== 'custom' && (
            <PredictionPreview month={month} periodType={periodType} year={periodType === 'yearly' ? yearOnly : year} />
          )}

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
