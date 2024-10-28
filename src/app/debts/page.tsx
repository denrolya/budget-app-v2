import { Download, Edit } from 'lucide-react';
import React, { useState } from 'react';

import DebtDetails from '@/components/features/debts/Details';
import SidebarListing from '@/components/features/debts/SidebarListing';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import Debt from '@/models/Debt';

export const DebtsManagementPage: React.FC = () => {
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const { icon: Icon } = ROUTES.DEBT_LIST;

  return (
    <PageWithSidebar contentScrollable>
      <PageWithSidebar.Sidebar>
        <SidebarListing selected={selectedDebt} onSelect={setSelectedDebt} />
      </PageWithSidebar.Sidebar>
      {selectedDebt && (
        <PageWithSidebar.Header title="Debt Details" onBack={() => setSelectedDebt(null)}>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </PageWithSidebar.Header>
      )}

      <PageWithSidebar.Content>
        {(selectedDebt) && (
          <DebtDetails debt={selectedDebt} />
        )}

        {(!selectedDebt) && (
          <div className="flex items-center justify-center h-full bg-muted -m-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Icon className="h-8 w-8 text-primary/60" />
              </div>
              <p className="text-muted-foreground max-w-[250px]">
                Select a category from the sidebar to view details
              </p>
            </div>
          </div>
        )}
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default DebtsManagementPage;
