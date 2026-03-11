import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Download, LayoutGrid, PieChart, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useBuckets } from '../hooks/useBuckets';
import { useHealthRules } from '../hooks/useHealthRules';
import { useMonthlyAvgStats } from '../hooks/useMonthlyAvgStats';
import BucketsVisualization from '../components/BucketsVisualization';
import {
  DragOverlayItem,
  DroppableBucketZone,
  DroppableUnassignedZone,
  parseDragId,
  unallocatedDragId,
  allocationDragId,
} from '../components/DroppableBucketZone';
import HealthPanel from '../components/HealthPanel';

const BucketsPage: React.FC = () => {
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
    setMonthlyExpenses,
    setVisualization,
    exportConfig,
    importConfig,
  } = useBuckets();

  // ── Backend avg stats (auto-seed + income for health rules) ─────────────────

  const { avgExpense, avgIncome } = useMonthlyAvgStats();

  // Auto-fill monthlyExpenses on first load when it hasn't been set by the user
  useEffect(() => {
    if (config.monthlyExpenses === null && avgExpense !== null) {
      setMonthlyExpenses(avgExpense);
    }
  }, [avgExpense]); // intentionally omit deps — run once when avgExpense arrives

  // ── Health ──────────────────────────────────────────────────────────────────

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

  // ── Drag & drop ─────────────────────────────────────────────────────────────

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

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
        // Dragging unallocated portion of an account → assign remainder to target bucket
        if (overId !== '__unassigned__') {
          allocateRemainder(parsed.accountId, overId);
        }
      } else {
        // Dragging an existing allocation
        if (overId === '__unassigned__') {
          removeAllocation(parsed.accountId, parsed.bucketId);
        } else if (overId !== parsed.bucketId) {
          moveAllocation(parsed.accountId, parsed.bucketId, overId);
        }
      }
    },
    [allocateRemainder, removeAllocation, moveAllocation],
  );

  // ── Overlay data ─────────────────────────────────────────────────────────────

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
    } else {
      const entries = entriesByBucket[parsed.bucketId] ?? [];
      const entry = entries.find((e) => e.account.id === parsed.accountId);
      if (!entry) return null;
      return {
        label: entry.account.name,
        balance: entry.allocatedBalance,
      };
    }
  }, [activeDragId, unassignedEntries, entriesByBucket]);

  // ── Import file input ────────────────────────────────────────────────────────

  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full flex-col bg-muted overflow-hidden">
      <div className="flex-1 min-h-0 p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-[350ms] ease-out">
        {/* Main: visualization (left) + assignment panel (right) */}
        <div className="flex-1 min-h-0 flex gap-3">
          {/* Left: visualization */}
          <Card className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col">
            <CardHeader className="flex-none py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Buckets</CardTitle>
                <div className="flex items-center gap-1.5">
                  {/* Viz toggle */}
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

                  {/* Import / Export */}
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) importConfig(file);
                      e.target.value = '';
                    }}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => importInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Import config</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={exportConfig}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export config</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              <BucketsVisualization
                buckets={buckets}
                entriesByBucket={entriesByBucket}
                unassignedEntries={unassignedEntries}
                baseCurrency={baseCurrency}
                visualization={config.visualization}
              />
            </CardContent>
          </Card>

          {/* Right: bucket assignment with DnD */}
          <Card className="w-80 shrink-0 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="flex-none py-3 px-4">
              <CardTitle className="text-base">Assign Accounts</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Drag accounts to buckets. Click the amount to edit or split across multiple buckets.
              </p>
            </CardHeader>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-3 space-y-2.5">
                  {/* Unassigned zone */}
                  <DroppableUnassignedZone
                    entries={unassignedEntries}
                    baseCurrency={baseCurrency}
                    totalBalance={totalBalance}
                  />

                  {/* Bucket zones */}
                  {buckets.map((bucket) => (
                    <DroppableBucketZone
                      key={bucket.id}
                      bucket={bucket}
                      entries={entriesByBucket[bucket.id] ?? []}
                      baseCurrency={baseCurrency}
                      totalBalance={totalBalance}
                      onRemove={(accountId) => removeAllocation(accountId, bucket.id)}
                      onUpdateAmount={(accountId, amount) => setAllocationAmount(accountId, bucket.id, amount)}
                    />
                  ))}
                </div>
              </ScrollArea>

              <DragOverlay>
                {overlayData && (
                  <DragOverlayItem
                    label={overlayData.label}
                    baseCurrency={baseCurrency}
                    balance={overlayData.balance}
                    pctLabel={overlayData.pctLabel}
                  />
                )}
              </DragOverlay>
            </DndContext>
          </Card>
        </div>

        {/* Bottom: health panel */}
        <HealthPanel
          health={health}
          monthlyExpenses={config.monthlyExpenses}
          monthlyIncome={avgIncome}
          baseCurrency={baseCurrency}
          onMonthlyExpensesChange={setMonthlyExpenses}
        />
      </div>
    </div>
  );
};

export default BucketsPage;
