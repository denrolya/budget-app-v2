import { useCallback, useState } from 'react';

import { MAX_SAVED_SCENARIOS, SCENARIOS_STORAGE_KEY } from '../constants';
import type { SavedScenario, ScenarioConfig, ScenarioEvent, TimeHorizon } from '../models/types';

const loadScenarios = (): SavedScenario[] => {
  try {
    const raw = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedScenario[];
  } catch {
    return [];
  }
};

const persistScenarios = (scenarios: SavedScenario[]) => {
  localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
};

export const useScenarios = () => {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(loadScenarios);

  const update = useCallback((updater: (prev: SavedScenario[]) => SavedScenario[]) => {
    setScenarios((prev) => {
      const next = updater(prev);
      persistScenarios(next);
      return next;
    });
  }, []);

  const saveScenario = useCallback(
    (name: string, horizon: TimeHorizon, overrides: Partial<ScenarioConfig>, events: ScenarioEvent[]) => {
      update((prev) => {
        const scenario: SavedScenario = {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date().toISOString(),
          horizon,
          overrides,
          events,
        };
        const next = [scenario, ...prev];
        return next.slice(0, MAX_SAVED_SCENARIOS);
      });
    },
    [update],
  );

  const deleteScenario = useCallback(
    (id: string) => {
      update((prev) => prev.filter((s) => s.id !== id));
    },
    [update],
  );

  const renameScenario = useCallback(
    (id: string, name: string) => {
      update((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    },
    [update],
  );

  return { scenarios, saveScenario, deleteScenario, renameScenario };
};
