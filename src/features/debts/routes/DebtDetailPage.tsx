import { Archive, ArchiveRestore, ChevronLeft, Download, Edit, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { confirm } from '@/lib/confirmation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm } from '@/contexts/Form';

import { useList as useDebtsQuery, useMutations as useDebtMutations } from '../api';
import DebtDetails from '../components/Details';

const DebtDetailsHeader: React.FC<{
  isClosed: boolean;
  onBack: () => void;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  onExport: () => void;
  onToggleClosed: () => Promise<void>;
}> = ({ isClosed, onBack, onDelete, onEdit, onExport, onToggleClosed }) => (
  <div className="flex items-center gap-2 px-4 h-12 border-b bg-background shrink-0">
    <Button aria-label="Back to debts" size="icon" variant="ghost" onClick={onBack}>
      <ChevronLeft aria-hidden="true" className="h-5 w-5" />
    </Button>

    <span className="flex-1 text-sm font-semibold truncate">Debt Details</span>

    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Export" size="icon" variant="outline" onClick={onExport}>
            <Download aria-hidden="true" className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export debt details</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={isClosed ? 'Reopen debt' : 'Close debt'}
            size="icon"
            variant="outline"
            onClick={onToggleClosed}
          >
            {isClosed ? (
              <ArchiveRestore aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Archive aria-hidden="true" className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isClosed ? 'Reopen debt' : 'Close debt'}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Edit debt" size="icon" variant="outline" onClick={onEdit}>
            <Edit aria-hidden="true" className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit debt details</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Delete debt" size="icon" variant="destructive" onClick={onDelete}>
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete debt</TooltipContent>
      </Tooltip>
    </div>
  </div>
);

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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete debt.');
    }
  };

  const onExport = () => {
    toast.message('Export is not implemented yet.');
  };

  if (!debtId) return <Navigate replace to="/debts" />;
  if (!data) return null;
  if (!debt) return <Navigate replace to="/debts" />;

  return (
    <div className="h-full flex flex-col min-h-0">
      <DebtDetailsHeader
        isClosed={Boolean(debt.closedAt)}
        onBack={() => navigate('/debts')}
        onDelete={onDelete}
        onEdit={() => openForm(FormType.Debt, debt)}
        onExport={onExport}
        onToggleClosed={onToggleClosed}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="min-h-full min-w-0 flex flex-col">
            <DebtDetails debt={debt} key={debtIdNum ?? debt.id} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default DebtDetailPage;
