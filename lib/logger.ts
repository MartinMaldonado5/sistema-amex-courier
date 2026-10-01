export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private serviceName: string;
  private isDevelopment: boolean;

  constructor(serviceName = 'amex-system') {
    this.serviceName = serviceName;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(entry: LogEntry): string {
    if (this.isDevelopment) {
      const colorMap = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';
      const color = colorMap[entry.level] || '';
      const reqInfo = entry.requestId ? ` [Req: ${entry.requestId}]` : '';
      const metaStr = entry.metadata ? `\n${JSON.stringify(entry.metadata, null, 2)}` : '';
      const errStr = entry.error?.stack ? `\n${entry.error.stack}` : '';

      return `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.service}]${reset}${reqInfo}: ${entry.message}${metaStr}${errStr}`;
    }

    return JSON.stringify(entry);
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>, err?: unknown) {
    let errorObj: LogEntry['error'] | undefined;
    if (err instanceof Error) {
      errorObj = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    } else if (err) {
      errorObj = {
        message: String(err),
      };
    }

    const requestId = (meta?.requestId as string) || undefined;
    const userId = (meta?.userId as string) || undefined;

    // Remove requestId/userId from metadata if present
    const cleanMeta = meta ? { ...meta } : undefined;
    if (cleanMeta) {
      delete cleanMeta.requestId;
      delete cleanMeta.userId;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      requestId,
      userId,
      metadata: cleanMeta && Object.keys(cleanMeta).length > 0 ? cleanMeta : undefined,
      error: errorObj,
    };

    const formatted = this.formatMessage(entry);

    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else if (level === 'debug') {
      console.debug(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>, error?: unknown) {
    this.write('warn', message, meta, error);
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    this.write('error', message, meta, error);
  }

  child(serviceName: string) {
    return new Logger(serviceName);
  }
}

export const logger = new Logger('amex-erp');
