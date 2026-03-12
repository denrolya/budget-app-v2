import moment from 'moment';
import { Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { confirm } from '@/lib/confirmation';

import { useListBudgets, useDeleteBudget } from '../api';
import type { BudgetDTO, BudgetPeriodType } from '../api/types';

import BudgetCreateDialog from './BudgetCreateDialog';

interface Props {
  selectedId: string | null;
}

const formatBudgetLabel = (b: BudgetDTO): string => {
  if (b.name) return b.name;
  if (b.periodType === 'monthly') return moment(b.startDate).format('MMMM YYYY');
  if (b.periodType === 'yearly') return moment(b.startDate).format('YYYY');
  return `${moment(b.startDate).format('MMM D')} – ${moment(b.endDate).format('MMM D, YYYY')}`;
};

const PERIOD_LABELS: Record<BudgetPeriodType, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

const PERIOD_ORDER: BudgetPeriodType[] = ['monthly', 'yearly', 'custom'];

const BudgetSidebar: React.FC<Props> = ({ selectedId }) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data } = useListBudgets();
  const { mutate: deleteBudget } = useDeleteBudget();

  const budgets = data ?? [];

  const grouped = PERIOD_ORDER.reduce<Record<BudgetPeriodType, BudgetDTO[]>>(
    (acc, pt) => {
      acc[pt] = budgets.filter((b) => b.periodType === pt).sort((a, b) => b.startDate.localeCompare(a.startDate));
      return acc;
    },
    { monthly: [], yearly: [], custom: [] },
  );

  const handleCreated = (budget: BudgetDTO, fillFromHistory?: boolean) => {
    navigate(`/budget/${budget.id}`, fillFromHistory ? { state: { fillFromHistory: true } } : undefined);
  };

  const handleDelete = async (e: React.MouseEvent, b: BudgetDTO) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete budget?',
      description: `Delete "${formatBudgetLabel(b)}"? This will remove all planned lines.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!ok) return;
    deleteBudget(b.id, {
      onSuccess: () => {
        if (String(b.id) === selectedId) navigate('/budget');
      },
    });
  };

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between px-3 py-3 border-b shrink-0">
          <span className="text-sm font-semibold">Budgets</span>
          <Button
            aria-label="New budget"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="py-2">
            {PERIOD_ORDER.map((pt) => {
              const items = grouped[pt];
              if (items.length === 0) return null;
              return (
                <div className="mb-2" key={pt}>
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {PERIOD_LABELS[pt]}
                  </p>
                  {items.map((b) => (
                    <div
                      className={cn(
                        'group flex items-center justify-between pr-2 hover:bg-accent transition-colors',
                        String(b.id) === selectedId && 'bg-accent',
                      )}
                      key={b.id}
                    >
                      <button
                        type="button"
                        className="flex-1 text-left px-3 py-1.5 text-sm min-w-0"
                        onClick={() => navigate(`/budget/${b.id}`)}
                      >
                        <span className={cn('truncate block', String(b.id) === selectedId && 'font-medium')}>
                          {formatBudgetLabel(b)}
                        </span>
                      </button>
                      <button
                        aria-label="Delete budget"
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => handleDelete(e, b)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}

            {budgets.length === 0 && (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">No budgets yet.</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setDialogOpen(true)}>
                  Create first budget
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <BudgetCreateDialog budgets={budgets} open={dialogOpen} onCreated={handleCreated} onOpenChange={setDialogOpen} />
    </>
  );
};

export default BudgetSidebar;
