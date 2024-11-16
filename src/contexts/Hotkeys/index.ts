import { HotkeysProvider, globalHotkeys } from '@/contexts/Hotkeys/context';
import { useHotkeys } from '@/contexts/Hotkeys/hooks';

export type {
  Hotkey,
  HotkeysContextType,
} from '@/types/hotkeys';

export { HotkeysProvider, useHotkeys, globalHotkeys };

export default HotkeysProvider;
