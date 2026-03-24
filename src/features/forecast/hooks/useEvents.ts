import { useCallback, useState } from 'react';

import { FORECAST_EVENTS_KEY } from '../constants';
import type { ScenarioEvent } from '../models/types';

export interface EventPreset {
  label: string;
  type: ScenarioEvent['type'];
  amount: number;
  recurring?: boolean;
  investPercent?: number;
}

export const EVENT_PRESETS: EventPreset[] = [
  // Income events
  { label: 'Salary raise', type: 'income', amount: 500, recurring: true },
  { label: 'Bonus received', type: 'income', amount: 2000 },
  { label: 'Side income', type: 'income', amount: 300, recurring: true },
  // Expense events
  { label: 'Large purchase', type: 'expense', amount: -3000 },
  { label: 'Move / relocation', type: 'expense', amount: -8000 },
  { label: 'Child expenses', type: 'expense', amount: -500, recurring: true },
  { label: 'Mortgage payment', type: 'expense', amount: -800, recurring: true },
  // Investment events
  { label: 'Sell asset', type: 'income', amount: 5000, investPercent: 80 },
  { label: 'Lump sum investment', type: 'investment', amount: 5000 },
  // Life changes
  { label: 'Retirement', type: 'income', amount: -2000, recurring: true },
  { label: 'Emergency draw', type: 'withdrawal', amount: -5000 },
];

const loadEvents = (): ScenarioEvent[] => {
  try {
    const raw = localStorage.getItem(FORECAST_EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScenarioEvent[];
  } catch {
    return [];
  }
};

const persistEvents = (events: ScenarioEvent[]) => {
  localStorage.setItem(FORECAST_EVENTS_KEY, JSON.stringify(events));
};

export const useEvents = () => {
  const [events, setEvents] = useState<ScenarioEvent[]>(loadEvents);

  const update = useCallback((updater: (prev: ScenarioEvent[]) => ScenarioEvent[]) => {
    setEvents((prev) => {
      const next = updater(prev);
      persistEvents(next);
      return next;
    });
  }, []);

  const addEvent = useCallback(
    (event: Omit<ScenarioEvent, 'id' | 'isActive'>) => {
      update((prev) => [
        ...prev,
        { ...event, id: crypto.randomUUID(), isActive: true, recurring: event.recurring ?? false },
      ]);
    },
    [update],
  );

  const removeEvent = useCallback(
    (id: string) => {
      update((prev) => prev.filter((e) => e.id !== id));
    },
    [update],
  );

  const toggleEvent = useCallback(
    (id: string) => {
      update((prev) => prev.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)));
    },
    [update],
  );

  const updateEvent = useCallback(
    (id: string, patch: Partial<ScenarioEvent>) => {
      update((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    },
    [update],
  );

  const replaceAll = useCallback((newEvents: ScenarioEvent[]) => {
    setEvents(newEvents);
    persistEvents(newEvents);
  }, []);

  return { events, addEvent, removeEvent, toggleEvent, updateEvent, replaceAll };
};
