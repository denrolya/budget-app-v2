import moment from 'moment';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { MOMENT_DATE_VIEW_FORMAT_2 } from '@/constants/datetime';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';

import { useBudget, useBudgetAnalytics, useBudgetInsights, useCategoryDailyStats, useListBudgets } from './api';
import BudgetAnalyticsTab from './components/BudgetAnalyticsTab';
import BudgetSignalsPanel from './components/BudgetSignalsPanel';
import BudgetDisplayCurrency, { type DisplayCurrency } from './components/BudgetDisplayCurrency';
import BudgetExportButton from './components/BudgetExportButton';
import BudgetFillFromHistoryButton from './components/BudgetFillFromHistoryButton';
import BudgetHeaderStats from './components/BudgetHeaderStats';
import BudgetSidebar from './components/BudgetSidebar';
import BudgetTable from './components/BudgetTable';

// ─── Page shell ───────────────────────────────────────────────────────────────

const ManagementPage: React.FC = () => {
  const budgetMatch = useMatch('/budget/:budgetId');
  const selectedId = budgetMatch?.params?.budgetId ?? null;

  return (
    <TooltipProvider delayDuration={0}>
      <PageWithSidebar collapsible defaultCollapsed resizable contentScrollable={false} sidebarWidth="w-64">
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
    </TooltipProvider>
  );
};

// ─── Index (no budget selected) ───────────────────────────────────────────────

const BudgetIndex: React.FC = () => {
  const { data } = useListBudgets();
  const budgets = data ?? [];

  if (budgets.length > 0) {
    const now = moment();
    const activeBudget = budgets.find(
      (b) => now.isSameOrAfter(moment(b.startDate), 'day') && now.isSameOrBefore(moment(b.endDate), 'day'),
    );
    const target = activeBudget ?? [...budgets].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
    return <Navigate replace to={`/budget/${target.id}`} />;
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

// ─── View type ────────────────────────────────────────────────────────────────

type BudgetView = 'plan' | 'analytics';

const TAB_LABELS: { value: BudgetView; label: string }[] = [
  { value: 'plan', label: 'Plan' },
  { value: 'analytics', label: 'Analytics' },
];

// ─── Budget detail ─────────────────────────────────────────────────────────────

const BudgetDetailRoute: React.FC = () => {
  const { budgetId } = useParams<{ budgetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const autoOpenFill = !!(location.state as Record<string, unknown> | null)?.fillFromHistory;
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('EUR');

  const view = (searchParams.get('view') ?? 'plan') as BudgetView;
  const setView = (v: BudgetView) => setSearchParams({ view: v }, { replace: true });

  const id = budgetId ? Number(budgetId) : null;

  const { data: budget, isLoading: budgetLoading, refetch: refetchBudget } = useBudget(id);
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useBudgetAnalytics(id);
  const { data: dailyStatsData } = useCategoryDailyStats(id);
  const { data: insightsData } = useBudgetInsights(id, displayCurrency);
  const { data: allBudgets } = useListBudgets();
  const { data: ratesData } = useExchangeRatesQuery();

  const rates = ratesData?.fixer ?? null;
  const analytics = analyticsData?.data ?? [];
  const dailyStats = dailyStatsData?.data;

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

  const daysPct = budget
    ? Math.min(
        100,
        (Math.max(0, moment().diff(moment(budget.startDate), 'days') + 1) /
          (moment(budget.endDate).diff(moment(budget.startDate), 'days') + 1)) *
          100,
      )
    : 0;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header — inline ticker stats + tab selector + actions */}
      <PageWithSidebar.Header
        title={title}
        subContent={
          <div className="-mt-1 -mx-4 overflow-hidden">
            <div className="h-0.5 bg-muted-foreground/10">
              <div style={{ width: `${daysPct}%` }} className="h-full bg-primary/40 transition-all" />
            </div>
          </div>
        }
        className="px-4 pt-2 pb-0"
      >
        <BudgetHeaderStats analytics={analytics} budget={budget} displayCurrency={displayCurrency} rates={rates} />

        <div aria-hidden className="w-px h-4 bg-border shrink-0" />

        <div className="flex items-center bg-muted rounded p-0.5">
          {TAB_LABELS.map((tab) => (
            <button
              className={cn(
                'px-3 py-1 text-2xs font-medium rounded transition-colors',
                view === tab.value
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              key={tab.value}
              onClick={() => setView(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div aria-hidden className="w-px h-4 bg-border shrink-0" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Previous budget"
              disabled={!prevId}
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => prevId && navigate(`/budget/${prevId}`)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
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
              variant="ghost"
              className="h-7 w-7"
              onClick={() => nextId && navigate(`/budget/${nextId}`)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
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
          seasonal={insightsData?.seasonal}
          trends={insightsData?.trends}
        />

        <BudgetExportButton analytics={analytics} budget={budget} displayCurrency={displayCurrency} rates={rates} />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Refresh analytics"
              disabled={budgetLoading || analyticsLoading}
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                refetchBudget();
                refetchAnalytics();
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
      </PageWithSidebar.Header>

      {/* Plan tab — signals + budget table */}
      {view === 'plan' && (
        <ScrollArea className="flex-1 min-h-0 tab-enter">
          <div className="p-4 space-y-4 pb-8">
            <BudgetSignalsPanel
              analytics={analytics}
              budget={budget}
              displayCurrency={displayCurrency}
              outliers={insightsData?.outliers}
              rates={rates}
              trends={insightsData?.trends}
            />
            <div className="rounded-lg border bg-card overflow-hidden">
              <BudgetTable
                analytics={analytics}
                budget={budget}
                budgetId={budget.id}
                dailyStats={dailyStats}
                displayCurrency={displayCurrency}
                rates={rates}
                seasonal={insightsData?.seasonal}
                trends={insightsData?.trends}
              />
            </div>
          </div>
        </ScrollArea>
      )}

      {/* Analytics tab — bento grid */}
      {view === 'analytics' && (
        <div className="flex-1 min-h-0">
          <BudgetAnalyticsTab analytics={analytics} budget={budget} displayCurrency={displayCurrency} rates={rates} />
        </div>
      )}
    </div>
  );
};

ManagementPage.displayName = 'BudgetManagementPage';
export default ManagementPage;
