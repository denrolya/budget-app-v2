import { Download, Edit } from 'lucide-react';
import React, { useMemo } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import SidebarListing from '@/features/debts/components/SidebarListing';
import { useDebts } from '@/hooks/financeData';
import { useIsMobile } from '@/hooks/use-mobile';

import { useList as useDebtsQuery } from '../api';
import DebtDetails from '../components/Details';
import Debt from '../models/Debt';

export const DebtsManagementPage: React.FC = () => {
  const { debtId } = useParams<{ debtId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const debts = useDebts();

  const debt = useMemo(() => {
    if (!debtId) return null;
    return debts?.find((d) => String(d.id) === debtId) ?? null;
  }, [debts, debtId]);

  const showSidebar = !isMobile || !debtId;

  return (
    <PageWithSidebar contentScrollable>
      {showSidebar && (
        <PageWithSidebar.Sidebar ariaLabel="Debts sidebar">
          <SidebarListing
            selected={debt}
            onClear={() => navigate('/debts')}
            onSelect={(d: Debt) => navigate(`/debts/${d.id}`)}
          />
        </PageWithSidebar.Sidebar>
      )}

      <PageWithSidebar.Content className="min-h-0 h-full min-w-0 overflow-x-hidden">
        <Routes>
          <Route
            index
            element={
              <div className="flex h-full w-full items-center justify-center bg-muted p-4">
                <div className="text-muted-foreground">Select a debt from the sidebar</div>
              </div>
            }
          />
          <Route element={<DebtDetailsRoute />} path=":debtId" />
          <Route element={<Navigate replace to="/debts" />} path="*" />
        </Routes>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

const DebtDetailsRoute: React.FC = () => {
  const { debtId } = useParams<{ debtId: string }>();
  const navigate = useNavigate();

  const { data } = useDebtsQuery();

  const debt = React.useMemo(() => {
    if (!debtId) return null;
    return data?.find((d) => String(d.id) === debtId) ?? null;
  }, [data, debtId]);

  if (!debtId) return <Navigate replace to="/debts" />;
  if (!data) return null;
  if (!debt) return <Navigate replace to="/debts" />;

  return (
    <>
      <PageWithSidebar.Header title="Debt Details" onBack={() => navigate('/debts')}>
        <Button aria-label="Export" size="icon" variant="outline">
          <Download aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button aria-label="Edit" size="icon" variant="outline">
          <Edit aria-hidden="true" className="h-4 w-4" />
        </Button>
      </PageWithSidebar.Header>

      <div className="p-4 min-w-0 overflow-x-hidden">
        <DebtDetails debt={debt} />
      </div>
    </>
  );
};

export default DebtsManagementPage;
