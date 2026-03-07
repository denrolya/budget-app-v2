import { useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Download, Edit, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm } from '@/contexts/Form';
import { useIsMobile } from '@/hooks/use-mobile';
import { confirm } from '@/lib/confirmation';

import { queryKeys, useTransactions as useDebtTransactions, useList as useDebtsQuery, useMutations as useDebtMutations } from '../api';
import DebtDetails from '../components/Details';
import SidebarListing from '../components/SidebarListing';
import type Debt from '../models/Debt';

export const DebtsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const debtMatch = useMatch('/debts/:debtId');
  const selectedDebtId = debtMatch?.params?.debtId ?? null;

  const { data } = useDebtsQuery({ withClosed: true });

  const selectedDebt = useMemo(() => {
    if (!selectedDebtId) return null;
    return data?.find((d) => String(d.id) === selectedDebtId) ?? null;
  }, [data, selectedDebtId]);

  const showSidebar = !isMobile || !selectedDebtId;

  return (
    <PageWithSidebar contentScrollable>
      {showSidebar && (
        <PageWithSidebar.Sidebar ariaLabel="Debts sidebar">
          <SidebarListing
            selected={selectedDebt}
            onClear={() => navigate('/debts')}
            onSelect={(d: Debt) => navigate(`/debts/${d.id}`)}
          />
        </PageWithSidebar.Sidebar>
      )}

      <PageWithSidebar.Content className="min-h-0 h-full min-w-0 overflow-x-hidden">
        <Routes>
          <Route index element={<DebtsIndex />} />
          <Route element={<DebtDetailsRoute />} path=":debtId" />
          <Route element={<Navigate replace to="/debts" />} path="*" />
        </Routes>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

const DebtsIndex: React.FC = () => (
  <div className="flex h-full w-full items-center justify-center bg-muted p-4">
    <div className="text-muted-foreground">Select a debt from the sidebar</div>
  </div>
);

const DebtDetailsRoute: React.FC = () => {
  const qc = useQueryClient();
  const { openForm } = useForm();
  const { debtId } = useParams<{ debtId: string }>();
  const navigate = useNavigate();

  const debtIdNum = debtId ? Number(debtId) : null;

  // List query: used for action buttons (edit, close, delete) — no transactions needed
  const { data } = useDebtsQuery({ withClosed: true });
  const { update, remove } = useDebtMutations();

  // Fetch transactions only when a debt is selected (lazy loading)
  const { data: transactions = [], isLoading: isLoadingTransactions } = useDebtTransactions(debtIdNum);

  const debt = useMemo(() => {
    if (!debtId) return null;
    return data?.find((d) => String(d.id) === debtId) ?? null;
  }, [data, debtId]);

  const refetchAllDebts = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.list({ withClosed: true }) }),
      qc.invalidateQueries({ queryKey: queryKeys.list({ withClosed: false }) }),
      debtIdNum ? qc.invalidateQueries({ queryKey: queryKeys.transactions(debtIdNum) }) : Promise.resolve(),
    ]);
  };

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

      await refetchAllDebts();
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

      await refetchAllDebts();
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

  const isClosed = Boolean(debt.closedAt);

  return (
    <>
      <PageWithSidebar.Header title="Debt Details" onBack={() => navigate('/debts')}>
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
            <Button aria-label="Edit" size="icon" variant="outline" onClick={() => openForm(FormType.Debt, debt)}>
              <Edit aria-hidden="true" className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit debt details</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Delete" size="icon" variant="destructive" onClick={onDelete}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete debt</TooltipContent>
        </Tooltip>
      </PageWithSidebar.Header>

      <div className="p-4 min-w-0 overflow-x-hidden">
        <DebtDetails debt={debt} transactions={transactions} isLoadingTransactions={isLoadingTransactions} />
      </div>
    </>
  );
};

export default DebtsManagementPage;
