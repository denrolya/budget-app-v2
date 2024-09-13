import { DebugLogger } from '@/utils/DebugLogger';

declare global {
  var logger: DebugLogger | {
    info: (message: any, component?: string) => void;
    warn: (message: any, component?: string) => void;
    error: (message: any, component?: string) => void;
  };
}
