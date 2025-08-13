/**
 * Production-ready logging system with levels and structured output
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private enableConsole: boolean = true;
  private enableRemote: boolean = false;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Set log level based on environment
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('lovable.dev');
      this.logLevel = isDev ? LogLevel.DEBUG : LogLevel.WARN;
      this.enableConsole = isDev;
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private async sendToRemote(entry: LogEntry) {
    if (!this.enableRemote) return;
    
    try {
      // In production, send to your logging service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      // Silent fail for logging service
    }
  }

  private logToConsole(entry: LogEntry) {
    if (!this.enableConsole) return;

    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.sessionId}]`;
    
    switch (entry.level) {
      case 'DEBUG':
        console.debug(prefix, entry.message, entry.data);
        break;
      case 'INFO':
        console.info(prefix, entry.message, entry.data);
        break;
      case 'WARN':
        console.warn(prefix, entry.message, entry.data);
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(prefix, entry.message, entry.data);
        break;
    }
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data);
    this.logToConsole(entry);
  }

  info(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(LogLevel.INFO, message, data);
    this.logToConsole(entry);
    this.sendToRemote(entry);
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.createLogEntry(LogLevel.WARN, message, data);
    this.logToConsole(entry);
    this.sendToRemote(entry);
  }

  error(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createLogEntry(LogLevel.ERROR, message, data);
    this.logToConsole(entry);
    this.sendToRemote(entry);
  }

  fatal(message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.FATAL, message, data);
    this.logToConsole(entry);
    this.sendToRemote(entry);
  }

  // Structured logging for specific events
  userAction(action: string, data?: any) {
    this.info(`User action: ${action}`, { type: 'user_action', action, ...data });
  }

  apiCall(endpoint: string, method: string, duration: number, status: number) {
    this.info(`API call: ${method} ${endpoint}`, {
      type: 'api_call',
      endpoint,
      method,
      duration,
      status
    });
  }

  performance(metric: string, value: number, unit: string = 'ms') {
    this.info(`Performance: ${metric}`, {
      type: 'performance',
      metric,
      value,
      unit
    });
  }
}

// Global logger instance
export const logger = Logger.getInstance();

// Replace console methods in production for better control
export const initializeLogger = (userId?: string) => {
  if (userId) {
    logger.setUserId(userId);
  }

  // Override console methods in production
  if (process.env.NODE_ENV === 'production') {
    const originalConsole = { ...console };
    
    console.log = (...args: any[]) => logger.debug(args.join(' '));
    console.info = (...args: any[]) => logger.info(args.join(' '));
    console.warn = (...args: any[]) => logger.warn(args.join(' '));
    console.error = (...args: any[]) => logger.error(args.join(' '));
    
    // Keep original methods available
    (window as any).__originalConsole = originalConsole;
  }
};
