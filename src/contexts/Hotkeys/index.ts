import { HotkeysProvider, globalHotkeys } from './context';
import { useHotkeys } from './hooks';

export type {
  Hotkey,
  HotkeysContextType,
} from '@/types/hotkeys';

export { HotkeysProvider, useHotkeys, globalHotkeys };

export default HotkeysProvider;
