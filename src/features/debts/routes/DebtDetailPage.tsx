import { Archive, ArchiveRestore, Download, Edit, Plus, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { confirm } from '@/lib/confirmation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm } from '@/contexts/Form';

import { useList as useDebtsQuery, useMutations as useDebtMutations } from '../api';
import DebtDetails from '../components/Details';

const DebtDetailPage: React.FC = () => {
  const { openForm } = useForm();
  const { debtId } = useParams<{ debtId: string }>();
  const navigate = useNavigate();

  const debtIdNum = debtId ? Number(debtId) : null;
  const { data } = useDebtsQuery({ withClosed: true });
  const { update, remove } = useDebtMutations();

  const debt = useMemo(() => {
    if (!debtId) return null;
    return data?.find((d) => String(d.id) === debtId) ?? null;
  }, [data, debtId]);

  const onToggleClosed = async () => {
    if (!debt?.id) return;

    try {
      if (debt.closedAt) {
        await update({ id: debt.id, payload: { closedAt: null } });
        toast.success('Debt reopened');
      } else {
        await update({ id: debt.id, payload: { closedAt: new Date().toISOString() } });
        toast.success('Debt closed');
      }
    } catch {
      toast.error('Failed to update debt status.');
    }
  };

  const onDelete = async () => {
    if (!debt?.id) return;

    const isConfirmed = await confirm({
      title: 'Delete Debt',
      description: 'Are you sure you want to delete this debt? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!isConfirmed) return;

    try {
      await remove({ id: debt.id });
      toast.success('Debt deleted');
      navigate('/debts');
    } catch {
      toast.error('Failed to delete debt.');
    }
  };

  const onExport = () => {
    toast.message('Export is not implemented yet.');
  };

  if (!debtId) return <Navigate replace to="/debts" />;
  if (!data) return null;
  if (!debt) return <Navigate replace to="/debts" />;

  const isClosed = Boolean(debt.closedAt);

  return (
    <div className="h-full flex flex-col min-h-0">
      <PageWithSidebar.Header title={debt.debtor} className="px-4 py-2" onBack={() => navigate('/debts')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Add Transaction"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => openForm(FormType.Transaction, { debt })}
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add new account transaction</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Export" size="icon" variant="ghost" className="h-7 w-7" onClick={onExport}>
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export debt details</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={isClosed ? 'Reopen debt' : 'Close debt'}
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onToggleClosed}
            >
              {isClosed ? (
                <ArchiveRestore aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <Archive aria-hidden="true" className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isClosed ? 'Reopen debt' : 'Close debt'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Edit debt"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => openForm(FormType.Debt, debt)}
            >
              <Edit aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit debt details</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Delete debt" size="icon" variant="destructive" className="h-7 w-7" onClick={onDelete}>
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete debt</TooltipContent>
        </Tooltip>
      </PageWithSidebar.Header>

      <div className="flex-1 min-h-0 overflow-hidden">
        <DebtDetails debt={debt} key={debtIdNum ?? debt.id} />
      </div>
    </div>
  );
};

export default DebtDetailPage;
