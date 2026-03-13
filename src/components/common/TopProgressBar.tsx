import { useIsFetching } from '@tanstack/react-query';
import React, { useEffect, useReducer, useSyncExternalStore } from 'react';

import { requestProgress } from '@/services/requestProgress';

const useAxiosCount = () => useSyncExternalStore(requestProgress.subscribe, requestProgress.getCount, () => 0);

type Phase = 'idle' | 'loading' | 'completing';
interface State {
  phase: Phase;
  progress: number;
}
type Action = { type: 'start' } | { type: 'stop' } | { type: 'tick' } | { type: 'reset' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'start':
      return {
        phase: 'loading',
        // If we were fading out, restart from a lower value so it feels fresh
        progress: state.phase === 'completing' ? 30 : Math.max(state.progress, 20),
      };
    case 'stop':
      return state.phase === 'loading' ? { phase: 'completing', progress: 100 } : state;
    case 'tick':
      return state.phase === 'loading'
        ? { ...state, progress: Math.min(state.progress + (85 - state.progress) * 0.08, 85) }
        : state;
    case 'reset':
      return { phase: 'idle', progress: 0 };
  }
};

const TopProgressBar: React.FC = () => {
  const queryCount = useIsFetching();
  const axiosCount = useAxiosCount();
  const isLoading = queryCount + axiosCount > 0;

  const [{ phase, progress }, dispatch] = useReducer(reducer, { phase: 'idle', progress: 0 });

  // React to loading state changes
  useEffect(() => {
    dispatch({ type: isLoading ? 'start' : 'stop' });
  }, [isLoading]);

  // Creep the bar toward 85% while requests are in flight
  useEffect(() => {
    if (phase !== 'loading') return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 200);
    return () => clearInterval(id);
  }, [phase]);

  // After completing, wait for the fade-out then reset
  useEffect(() => {
    if (phase !== 'completing') return;
    const id = setTimeout(() => dispatch({ type: 'reset' }), 600);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === 'idle') return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div
        style={{
          width: `${progress}%`,
          opacity: phase === 'completing' ? 0 : 1,
          boxShadow: phase === 'loading' ? '0 0 8px 0 hsl(var(--primary) / 0.7)' : 'none',
          transition:
            phase === 'completing'
              ? 'width 200ms ease-out, opacity 300ms ease 200ms, box-shadow 200ms ease'
              : 'width 300ms linear',
        }}
        className="h-full bg-primary"
      />
    </div>
  );
};

export default TopProgressBar;
