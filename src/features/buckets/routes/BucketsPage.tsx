import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Download, Eye, EyeOff, LayoutGrid, PieChart, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

import { useBuckets } from '../hooks/useBuckets';
import { useHealthRules } from '../hooks/useHealthRules';
import { useMonthlyAvgStats } from '../hooks/useMonthlyAvgStats';
import BucketsVisualization from '../components/BucketsVisualization';
import {
  DragOverlayItem,
  DroppableBucketZone,
  DroppableUnassignedZone,
} from '../components/DroppableBucketZone';
import { parseDragId } from '../lib/dragId';
import HealthPanel from '../components/HealthPanel';

const BucketsPage: React.FC = () => {
  const isMobile = useIsMobile();

  const {
    config,
    buckets,
    entriesByBucket,
    unassignedEntries,
    bucketBalances,
    baseCurrency,
    totalBalance,
    unassignedBalance,
    strongCurrencyBalance,
    maxSingleAccountBalance,
    allocateRemainder,
    removeAllocation,
    moveAllocation,
    setAllocationAmount,
    setBucketTarget,
    setMonthlyExpenses,
    setVisualization,
    exportConfig,
    importConfig,
  } = useBuckets();

  // ── Backend avg stats ────────────────────────────────────────────────────────

  const { avgExpense, avgIncome } = useMonthlyAvgStats();

  useEffect(() => {
    if (config.monthlyExpenses === null && avgExpense !== null) {
      setMonthlyExpenses(avgExpense);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time default: only set when avgExpense loads, not when config changes
  }, [avgExpense]);

  // ── Health ───────────────────────────────────────────────────────────────────

  const healthCtx = useMemo(
    () => ({
      buckets,
      bucketBalances,
      entriesByBucket,
      totalBalance,
      unassignedBalance,
      monthlyExpenses: config.monthlyExpenses,
      monthlyIncome: avgIncome,
      baseCurrency,
      strongCurrencyBalance,
      maxSingleAccountBalance,
    }),
    [
      buckets,
      bucketBalances,
      entriesByBucket,
      totalBalance,
      unassignedBalance,
      config.monthlyExpenses,
      avgIncome,
      baseCurrency,
      strongCurrencyBalance,
      maxSingleAccountBalance,
    ],
  );

  const health = useHealthRules(healthCtx);

  // ── Zero-balance filter ──────────────────────────────────────────────────────

  const [hideZeroBalance, setHideZeroBalance] = useState(false);

  const filteredUnassigned = useMemo(
    () => (hideZeroBalance ? unassignedEntries.filter((e) => e.unallocatedBalance > 0) : unassignedEntries),
    [unassignedEntries, hideZeroBalance],
  );

  const filteredEntriesByBucket = useMemo(() => {
    if (!hideZeroBalance) return entriesByBucket;
    const filtered: Record<string, (typeof entriesByBucket)[string]> = {};
    for (const [id, entries] of Object.entries(entriesByBucket)) {
      filtered[id] = entries.filter((e) => e.allocatedBalance > 0);
    }
    return filtered;
  }, [entriesByBucket, hideZeroBalance]);

  // ── Drag & drop ──────────────────────────────────────────────────────────────

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const activeId = String(event.active.id);
      const overId = event.over ? String(event.over.id) : null;
      if (!overId) return;
      const parsed = parseDragId(activeId);
      if (!parsed) return;
      if (parsed.type === 'unallocated') {
        if (overId !== '__unassigned__') allocateRemainder(parsed.accountId, overId);
      } else {
        if (overId === '__unassigned__') removeAllocation(parsed.accountId, parsed.bucketId);
        else if (overId !== parsed.bucketId) moveAllocation(parsed.accountId, parsed.bucketId, overId);
      }
    },
    [allocateRemainder, removeAllocation, moveAllocation],
  );

  const overlayData = useMemo(() => {
    if (!activeDragId) return null;
    const parsed = parseDragId(activeDragId);
    if (!parsed) return null;
    if (parsed.type === 'unallocated') {
      const entry = unassignedEntries.find((e) => e.account.id === parsed.accountId);
      if (!entry) return null;
      return {
        label: entry.account.name,
        balance: entry.unallocatedBalance,
        pctLabel: entry.isPartial ? 'partial' : undefined,
      };
    }
    const entry = (entriesByBucket[parsed.bucketId] ?? []).find((e) => e.account.id === parsed.accountId);
    if (!entry) return null;
    return { label: entry.account.name, balance: entry.allocatedBalance, pctLabel: undefined };
  }, [activeDragId, unassignedEntries, entriesByBucket]);

  // ── Import file input ────────────────────────────────────────────────────────

  const importInputRef = useRef<HTMLInputElement>(null);

  // ── Shared DnD assign panel ───────────────────────────────────────────────────

  const assignPanel = (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-1.5 space-y-1.5">
          <DroppableUnassignedZone
            baseCurrency={baseCurrency}
            entries={filteredUnassigned}
            totalBalance={totalBalance}
          />
          {buckets.map((bucket) => (
            <DroppableBucketZone
              baseCurrency={baseCurrency}
              bucket={bucket}
              entries={filteredEntriesByBucket[bucket.id] ?? []}
              totalBalance={totalBalance}
              key={bucket.id}
              onRemove={(accountId) => removeAllocation(accountId, bucket.id)}
              onSetTarget={(amount) => setBucketTarget(bucket.id, amount)}
              onUpdateAmount={(accountId, amount) => setAllocationAmount(accountId, bucket.id, amount)}
            />
          ))}
        </div>
      </ScrollArea>
      <DragOverlay>
        {overlayData && (
          <DragOverlayItem
            balance={overlayData.balance}
            baseCurrency={baseCurrency}
            label={overlayData.label}
            pctLabel={overlayData.pctLabel}
          />
        )}
      </DragOverlay>
    </DndContext>
  );

  // ── Viz toolbar ──────────────────────────────────────────────────────────────

  const vizToolbar = (
    <div className="flex items-center gap-1.5">
      <div className="flex rounded-md border overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={config.visualization === 'treemap' ? 'secondary' : 'ghost'}
              className="h-7 w-7 rounded-none border-0"
              onClick={() => setVisualization('treemap')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Treemap</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={config.visualization === 'pie' ? 'secondary' : 'ghost'}
              className="h-7 w-7 rounded-none border-0 border-l"
              onClick={() => setVisualization('pie')}
            >
              <PieChart className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pie chart</TooltipContent>
        </Tooltip>
      </div>
      <input
        accept=".json"
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importConfig(file);
          e.target.value = '';
        }}
        ref={importInputRef}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Import config" size="icon" variant="ghost" className="h-7 w-7" onClick={() => importInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import config</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Export config" size="icon" variant="ghost" className="h-7 w-7" onClick={exportConfig}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export config</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={hideZeroBalance ? 'Show zero-balance accounts' : 'Hide zero-balance accounts'}
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setHideZeroBalance((v) => !v)}
          >
            {hideZeroBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{hideZeroBalance ? 'Show zero-balance' : 'Hide zero-balance'}</TooltipContent>
      </Tooltip>
    </div>
  );

  // ── Mobile layout ─────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div className="flex h-full flex-col bg-muted overflow-hidden">
        <div className="flex-1 min-h-0 p-3 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-[350ms] ease-out">
          <Tabs defaultValue="assign" className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid grid-cols-3 shrink-0">
              <TabsTrigger value="assign">Assign</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
            </TabsList>

            <TabsContent value="assign" className="flex-1 min-h-0 overflow-hidden mt-2">
              <Card className="h-full flex flex-col overflow-hidden">
                <CardHeader className="flex-none py-2 px-3">
                  <CardTitle className="text-sm">Assign Accounts</CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Drag accounts to buckets or tap the amount to edit.
                  </p>
                </CardHeader>
                {assignPanel}
              </Card>
            </TabsContent>

            <TabsContent value="chart" className="flex-1 min-h-0 overflow-hidden mt-2">
              <Card className="h-full flex flex-col overflow-hidden">
                <CardHeader className="flex-none py-2 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Buckets</CardTitle>
                    {vizToolbar}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-0">
                  <BucketsVisualization
                    baseCurrency={baseCurrency}
                    buckets={buckets}
                    entriesByBucket={entriesByBucket}
                    unassignedEntries={unassignedEntries}
                    visualization={config.visualization}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="flex-1 min-h-0 overflow-auto mt-2">
              <HealthPanel
                baseCurrency={baseCurrency}
                health={health}
                monthlyExpenses={config.monthlyExpenses}
                monthlyIncome={avgIncome}
                onMonthlyExpensesChange={setMonthlyExpenses}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────────

  return (
    <PageWithSidebar collapsible resizable contentScrollable={false} sidebarWidth="w-72">
      <PageWithSidebar.Header title="Buckets">{vizToolbar}</PageWithSidebar.Header>

      <PageWithSidebar.Sidebar ariaLabel="Assign accounts sidebar">{assignPanel}</PageWithSidebar.Sidebar>

      <PageWithSidebar.Content className="min-h-0 h-full">
        <div className="h-full flex flex-col p-3 md:p-4 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-[350ms] ease-out">
          <div className="flex-1 min-h-0">
            <Card className="h-full min-w-0 overflow-hidden">
              <CardContent className="h-full p-0">
                <BucketsVisualization
                  baseCurrency={baseCurrency}
                  buckets={buckets}
                  entriesByBucket={entriesByBucket}
                  unassignedEntries={unassignedEntries}
                  visualization={config.visualization}
                />
              </CardContent>
            </Card>
          </div>
          <HealthPanel
            baseCurrency={baseCurrency}
            health={health}
            monthlyExpenses={config.monthlyExpenses}
            monthlyIncome={avgIncome}
            onMonthlyExpensesChange={setMonthlyExpenses}
          />
        </div>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default BucketsPage;
