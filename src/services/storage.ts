type StorageType = 'localStorage' | 'sessionStorage';

const storageType: StorageType =
  import.meta.env.VITE_STORAGE_TYPE === 'sessionStorage' ? 'sessionStorage' : 'localStorage';

const storage = {
  setItem: (key: string, value: unknown): void => {
    const storageEngine = storageType === 'localStorage' ? localStorage : sessionStorage;
    storageEngine.setItem(key, JSON.stringify(value));
  },
  getItem: <T = unknown>(key: string): T | null => {
    const storageEngine = storageType === 'localStorage' ? localStorage : sessionStorage;
    const item = storageEngine.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  },
  removeItem: (key: string): void => {
    const storageEngine = storageType === 'localStorage' ? localStorage : sessionStorage;
    storageEngine.removeItem(key);
  },
  clear: (): void => {
    const storageEngine = storageType === 'localStorage' ? localStorage : sessionStorage;
    storageEngine.clear();
  },
};

export default storage;
