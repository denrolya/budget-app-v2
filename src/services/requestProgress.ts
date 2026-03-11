type Listener = () => void;

let count = 0;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

export const requestProgress = {
  increment() {
    count++;
    notify();
  },
  decrement() {
    count = Math.max(0, count - 1);
    notify();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getCount() {
    return count;
  },
};
