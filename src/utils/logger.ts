/**
 * Sistema de logging estruturado para substituir console.log em produção
 * Otimizado para ambiente multi-tenant
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  tenantId?: string;
  userId?: string;
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment: boolean;
  private minLevel: LogLevel;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    tenantId?: string,
    userId?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      tenantId,
      userId,
      context,
      data
    };
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    if (this.isDevelopment) {
      // Em desenvolvimento, usar console para debug
      const logMethod = entry.level === LogLevel.ERROR ? console.error : 
                       entry.level === LogLevel.WARN ? console.warn : console.log;
      
      logMethod(`[${entry.level.toUpperCase()}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`, 
                entry.data ? entry.data : '');
    } else {
      // Em produção, enviar para serviço de logging (futuro)
      // Por enquanto, apenas armazenar em localStorage para debug se necessário
      if (entry.level === LogLevel.ERROR) {
        const errorLogs = JSON.parse(localStorage.getItem('app_error_logs') || '[]');
        errorLogs.push(entry);
        // Manter apenas os últimos 10 erros
        if (errorLogs.length > 10) errorLogs.shift();
        localStorage.setItem('app_error_logs', JSON.stringify(errorLogs));
      }
    }
  }

  error(message: string, data?: any, context?: string, tenantId?: string, userId?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, data, tenantId, userId);
    this.writeLog(entry);
  }

  warn(message: string, data?: any, context?: string, tenantId?: string, userId?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, data, tenantId, userId);
    this.writeLog(entry);
  }

  info(message: string, data?: any, context?: string, tenantId?: string, userId?: string): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, data, tenantId, userId);
    this.writeLog(entry);
  }

  debug(message: string, data?: any, context?: string, tenantId?: string, userId?: string): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, data, tenantId, userId);
    this.writeLog(entry);
  }

  /**
   * Recupera logs de erro armazenados (para debug)
   */
  getStoredErrors(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('app_error_logs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Limpa logs armazenados
   */
  clearStoredErrors(): void {
    localStorage.removeItem('app_error_logs');
  }
}

// Instância singleton do logger
export const logger = new Logger();