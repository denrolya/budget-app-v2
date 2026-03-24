import { useCallback, useState } from 'react';

import { DEFAULT_ANALYSIS_MONTHS, FORECAST_STORAGE_KEY } from '../constants';
import type { AnalysisWindow } from '../constants';
import type { ReferenceLine, ScenarioConfig, ScenarioEvent, TimeHorizon } from '../models/types';

interface PersistedConfig {
  version: 1;
  horizon: TimeHorizon;
  showFi: boolean;
  analysisMonths?: AnalysisWindow;
  overrides: Partial<ScenarioConfig>;
  events: ScenarioEvent[];
  referenceLines?: ReferenceLine[];
}

const loadConfig = (): Partial<PersistedConfig> => {
  try {
    const raw = localStorage.getItem(FORECAST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedConfig;
    if (parsed.version !== 1) return {};
    return parsed;
  } catch {
    return {};
  }
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const persistConfig = (config: PersistedConfig) => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    localStorage.setItem(FORECAST_STORAGE_KEY, JSON.stringify(config));
  }, 300);
};

export const useForecastConfig = () => {
  const initial = loadConfig();
  const [horizon, setHorizonState] = useState<TimeHorizon>(initial.horizon ?? 12);
  const [showFi, setShowFiState] = useState(initial.showFi ?? true);
  const [analysisMonths, setAnalysisMonthsState] = useState<AnalysisWindow>(
    (initial.analysisMonths as AnalysisWindow) ?? DEFAULT_ANALYSIS_MONTHS,
  );
  const [overrides, setOverridesState] = useState<Partial<ScenarioConfig>>(initial.overrides ?? {});
  const [referenceLines, setReferenceLinesState] = useState<ReferenceLine[]>(initial.referenceLines ?? []);

  const save = useCallback(
    (
      h: TimeHorizon,
      fi: boolean,
      am: AnalysisWindow,
      ov: Partial<ScenarioConfig>,
      events: ScenarioEvent[],
      refs: ReferenceLine[],
    ) => {
      persistConfig({
        version: 1,
        horizon: h,
        showFi: fi,
        analysisMonths: am,
        overrides: ov,
        events,
        referenceLines: refs,
      });
    },
    [],
  );

  const setHorizon = useCallback(
    (h: TimeHorizon, events: ScenarioEvent[]) => {
      setHorizonState(h);
      save(h, showFi, analysisMonths, overrides, events, referenceLines);
    },
    [showFi, analysisMonths, overrides, referenceLines, save],
  );

  const setAnalysisMonths = useCallback(
    (am: AnalysisWindow, events: ScenarioEvent[]) => {
      setAnalysisMonthsState(am);
      save(horizon, showFi, am, overrides, events, referenceLines);
    },
    [horizon, showFi, overrides, referenceLines, save],
  );

  const setShowFi = useCallback(
    (fi: boolean, events: ScenarioEvent[]) => {
      setShowFiState(fi);
      save(horizon, fi, analysisMonths, overrides, events, referenceLines);
    },
    [horizon, analysisMonths, overrides, referenceLines, save],
  );

  const setOverrides = useCallback(
    (updater: (prev: Partial<ScenarioConfig>) => Partial<ScenarioConfig>, events: ScenarioEvent[]) => {
      setOverridesState((prev) => {
        const next = updater(prev);
        save(horizon, showFi, analysisMonths, next, events, referenceLines);
        return next;
      });
    },
    [horizon, showFi, analysisMonths, referenceLines, save],
  );

  const resetOverrides = useCallback(
    (events: ScenarioEvent[]) => {
      setOverridesState({});
      save(horizon, showFi, analysisMonths, {}, events, referenceLines);
    },
    [horizon, showFi, analysisMonths, referenceLines, save],
  );

  const addReferenceLine = useCallback(
    (line: Omit<ReferenceLine, 'id'>, events: ScenarioEvent[]) => {
      setReferenceLinesState((prev) => {
        const next = [...prev, { ...line, id: crypto.randomUUID() }];
        save(horizon, showFi, analysisMonths, overrides, events, next);
        return next;
      });
    },
    [horizon, showFi, analysisMonths, overrides, save],
  );

  const removeReferenceLine = useCallback(
    (id: string, events: ScenarioEvent[]) => {
      setReferenceLinesState((prev) => {
        const next = prev.filter((l) => l.id !== id);
        save(horizon, showFi, analysisMonths, overrides, events, next);
        return next;
      });
    },
    [horizon, showFi, analysisMonths, overrides, save],
  );

  const updateReferenceLine = useCallback(
    (id: string, updates: Partial<Omit<ReferenceLine, 'id'>>, events: ScenarioEvent[]) => {
      setReferenceLinesState((prev) => {
        const next = prev.map((l) => (l.id === id ? { ...l, ...updates } : l));
        save(horizon, showFi, analysisMonths, overrides, events, next);
        return next;
      });
    },
    [horizon, showFi, analysisMonths, overrides, save],
  );

  const exportConfig = useCallback(
    (events: ScenarioEvent[]) => {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        horizon,
        showFi,
        overrides,
        events,
        referenceLines,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateSuffix = new Date().toISOString().slice(0, 10);
      a.download = `forecast-${dateSuffix}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [horizon, showFi, overrides, referenceLines],
  );

  const importConfig = useCallback(
    (file: File, onEvents: (events: ScenarioEvent[]) => void) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string) as Partial<PersistedConfig>;
          if (parsed.version !== 1) return;
          if (parsed.horizon) setHorizonState(parsed.horizon);
          if (parsed.showFi != null) setShowFiState(parsed.showFi);
          if (parsed.overrides) setOverridesState(parsed.overrides);
          if (parsed.events) onEvents(parsed.events);
          if (parsed.referenceLines) setReferenceLinesState(parsed.referenceLines);
          persistConfig({
            version: 1,
            horizon: parsed.horizon ?? horizon,
            showFi: parsed.showFi ?? showFi,
            overrides: parsed.overrides ?? overrides,
            events: parsed.events ?? [],
            referenceLines: parsed.referenceLines ?? referenceLines,
          });
        } catch {
          // invalid file — ignore
        }
      };
      reader.readAsText(file);
    },
    [horizon, showFi, overrides, referenceLines],
  );

  return {
    horizon,
    setHorizon,
    showFi,
    setShowFi,
    analysisMonths,
    setAnalysisMonths,
    overrides,
    setOverrides,
    resetOverrides,
    referenceLines,
    addReferenceLine,
    removeReferenceLine,
    updateReferenceLine,
    exportConfig,
    importConfig,
  };
};
