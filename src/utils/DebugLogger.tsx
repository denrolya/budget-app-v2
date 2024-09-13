import moment from 'moment';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

class DebugLogger {
  private static instance: DebugLogger;
  private readonly isDev: boolean;

  private constructor() {
    this.isDev = import.meta.env.DEV;
  }

  public static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private formatMessage(message: unknown): string {
    if (typeof message === 'object' && message !== null) {
      return JSON.stringify(message, null, 2);
    }
    return String(message);
  }

  private log(message: unknown, level: LogLevel, component?: string): void {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    const componentInfo = component ? `[${component}]` : '';
    const formattedMessage = this.formatMessage(message);
    const logMessage = `[${level}] ${timestamp} ${componentInfo}:`;

    switch (level) {
      case 'INFO':
        console.log('%c' + logMessage, 'color: cyan; font-weight: bold;', formattedMessage);
        break;
      case 'WARN':
        console.warn('%c' + logMessage, 'color: yellow; font-weight: bold;', formattedMessage);
        break;
      case 'ERROR':
        console.error('%c' + logMessage, 'color: red; font-weight: bold;', formattedMessage);
        break;
    }
  }

  public info(message: unknown, component?: string): void {
    this.log(message, 'INFO', component);
  }

  public warn(message: unknown, component?: string): void {
    this.log(message, 'WARN', component);
  }

  public error(message: unknown, component?: string): void {
    this.log(message, 'ERROR', component);
  }
}

const logger = DebugLogger.getInstance();

export { logger, DebugLogger };
