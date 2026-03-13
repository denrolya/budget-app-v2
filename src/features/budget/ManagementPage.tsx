import moment from 'moment';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useMatch, useNavigate, useParams } from 'react-router-dom';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { MOMENT_DATE_VIEW_FORMAT_2 } from '@/constants/datetime';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';

import { useBudget, useBudgetAnalytics, useCategoryDailyStats, useListBudgets } from './api';
import BudgetAlertsSection from './components/BudgetAlertsSection';
import BudgetCategoryBarChart from './components/BudgetCategoryBarChart';
import BudgetDisplayCurrency, { type DisplayCurrency } from './components/BudgetDisplayCurrency';
import BudgetDistributionChart from './components/BudgetDistributionChart';
import BudgetExportButton from './components/BudgetExportButton';
import BudgetFillFromHistoryButton from './components/BudgetFillFromHistoryButton';
import BudgetHeatmapSection from './components/BudgetHeatmapSection';
import BudgetPaceChart from './components/BudgetPaceChart';
import BudgetSidebar from './components/BudgetSidebar';
import BudgetSummaryCards from './components/BudgetSummaryCards';
import BudgetTable from './components/BudgetTable';

// ─── Page shell ───────────────────────────────────────────────────────────────

const ManagementPage: React.FC = () => {
  const budgetMatch = useMatch('/budget/:budgetId');
  const selectedId = budgetMatch?.params?.budgetId ?? null;

  return (
    <PageWithSidebar contentScrollable={false} sidebarWidth="w-64">
      <PageWithSidebar.Sidebar ariaLabel="Budget sidebar">
        <BudgetSidebar selectedId={selectedId} />
      </PageWithSidebar.Sidebar>

      <PageWithSidebar.Content className="min-h-0 h-full">
        <Routes>
          <Route index element={<BudgetIndex />} />
          <Route element={<BudgetDetailRoute />} path=":budgetId" />
          <Route element={<Navigate replace to="/budget" />} path="*" />
        </Routes>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

// ─── Index (no budget selected) ───────────────────────────────────────────────

const BudgetIndex: React.FC = () => {
  const { data } = useListBudgets();
  const budgets = data ?? [];

  if (budgets.length > 0) {
    return <Navigate replace to={`/budget/${budgets[0].id}`} />;
  }

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">No budgets yet</p>
        <p className="text-sm text-muted-foreground">Create your first budget using the + button in the sidebar.</p>
      </div>
    </div>
  );
};

// ─── Budget detail ─────────────────────────────────────────────────────────────

const BudgetDetailRoute: React.FC = () => {
  const { budgetId } = useParams<{ budgetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const autoOpenFill = !!(location.state as Record<string, unknown> | null)?.fillFromHistory;
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('EUR');

  const id = budgetId ? Number(budgetId) : null;

  const { data: budget, isLoading: budgetLoading, refetch: refetchBudget } = useBudget(id);
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useBudgetAnalytics(id);
  const { data: dailyStatsData } = useCategoryDailyStats(id);
  const { data: allBudgets } = useListBudgets();
  const { data: ratesData } = useExchangeRatesQuery();

  const rates = ratesData?.fixer ?? null;
  const analytics = analyticsData?.data ?? [];
  const dailyStats = dailyStatsData?.data;

  // Prev / next navigation — sort by startDate asc
  const { prevId, nextId } = useMemo(() => {
    if (!allBudgets || !id) return { prevId: null, nextId: null };
    const sorted = [...allBudgets].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const idx = sorted.findIndex((b) => b.id === id);
    return {
      prevId: idx > 0 ? sorted[idx - 1].id : null,
      nextId: idx < sorted.length - 1 ? sorted[idx + 1].id : null,
    };
  }, [allBudgets, id]);

  if (!id) return <Navigate replace to="/budget" />;
  if (budgetLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!budget) return <Navigate replace to="/budget" />;

  const startFormatted = moment(budget.startDate).format(MOMENT_DATE_VIEW_FORMAT_2);
  const endFormatted = moment(budget.endDate).format(MOMENT_DATE_VIEW_FORMAT_2);
  const periodLabel =
    budget.periodType === 'monthly'
      ? moment(budget.startDate).format('MMMM YYYY')
      : budget.periodType === 'yearly'
        ? moment(budget.startDate).format('YYYY')
        : `${startFormatted} – ${endFormatted}`;

  const title = budget.name ? `${budget.name} (${periodLabel})` : periodLabel;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <PageWithSidebar.Header
        title={title}
        subContent={
          <BudgetSummaryCards analytics={analytics} budget={budget} displayCurrency={displayCurrency} rates={rates} />
        }
        className="px-4 pt-2 pb-0"
      >
        {/* Prev / Next navigation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Previous budget"
              disabled={!prevId}
              size="icon"
              variant="outline"
              onClick={() => prevId && navigate(`/budget/${prevId}`)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Previous budget</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Next budget"
              disabled={!nextId}
              size="icon"
              variant="outline"
              onClick={() => nextId && navigate(`/budget/${nextId}`)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Next budget</TooltipContent>
        </Tooltip>

        <BudgetDisplayCurrency value={displayCurrency} onChange={setDisplayCurrency} />

        <BudgetFillFromHistoryButton
          autoOpen={autoOpenFill}
          budget={budget}
          displayCurrency={displayCurrency}
          rates={rates}
        />

        <BudgetExportButton analytics={analytics} budget={budget} displayCurrency={displayCurrency} rates={rates} />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Refresh analytics"
              disabled={budgetLoading || analyticsLoading}
              size="icon"
              variant="outline"
              onClick={() => {
                refetchBudget();
                refetchAnalytics();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
      </PageWithSidebar.Header>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6 pb-8">
          {/* Alerts */}
          <BudgetAlertsSection analytics={analytics} budget={budget} displayCurrency={displayCurrency} rates={rates} />

          {/* Spending heatmap */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Spending heatmap
            </p>
            <div className="rounded-lg border bg-card p-3">
              <BudgetHeatmapSection
                analytics={analytics}
                budget={budget}
                displayCurrency={displayCurrency}
                rates={rates}
              />
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Expense progress
              </p>
              <div className="rounded-lg border bg-card p-3">
                <BudgetPaceChart
                  analytics={analytics}
                  budget={budget}
                  displayCurrency={displayCurrency}
                  rates={rates}
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Expense distribution
              </p>
              <div className="rounded-lg border bg-card p-3">
                <BudgetDistributionChart analytics={analytics} displayCurrency={displayCurrency} rates={rates} />
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Planned vs actual by category
            </p>
            <div className="rounded-lg border bg-card p-3">
              <BudgetCategoryBarChart
                analytics={analytics}
                budget={budget}
                displayCurrency={displayCurrency}
                rates={rates}
              />
            </div>
          </div>

          <Separator />

          {/* Budget table */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Budget lines</p>
            <div className="rounded-lg border bg-card overflow-hidden">
              <BudgetTable
                analytics={analytics}
                budget={budget}
                budgetId={budget.id}
                dailyStats={dailyStats}
                displayCurrency={displayCurrency}
                rates={rates}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

ManagementPage.displayName = 'BudgetManagementPage';
export default ManagementPage;
