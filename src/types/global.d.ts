import { DebugLogger } from '@/utils/DebugLogger';

declare global {
  let logger: DebugLogger | {
    info: (message: any, component?: string) => void;
    warn: (message: any, component?: string) => void;
    error: (message: any, component?: string) => void;
  };
}
