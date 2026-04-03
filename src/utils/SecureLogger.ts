// ============================================================================
// SECURE LOGGER - Production-safe logging utility
// ============================================================================
// Prevents sensitive data leakage in production while maintaining debug capability

const isDevelopment = import.meta.env.DEV;
const isPreview = import.meta.env.MODE === 'preview';

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  namespace?: string;
  sensitive?: boolean; // For logs that should never appear in production
}

class SecureLogger {
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  private static formatMessage(level: LogLevel, message: string, namespace?: string): string {
    const prefix = namespace ? `[${namespace}]` : '';
    return `[${level.toUpperCase()}] ${this.getTimestamp()} ${prefix} ${message}`;
  }

  /**
   * Check if logging is allowed for this level
   */
  private static shouldLog(level: LogLevel, sensitive?: boolean): boolean {
    // Never log sensitive data in production/preview
    if (sensitive && !isDevelopment) {
      return false;
    }

    // In production, only log errors and warnings
    if (!isDevelopment && !isPreview) {
      return level === 'error' || level === 'warn';
    }

    // In development/preview, log everything
    return true;
  }

  /**
   * Debug log - only in development
   */
  static debug(message: string, options?: LogOptions): void {
    if (this.shouldLog('debug', options?.sensitive)) {
      console.debug(
        this.formatMessage('debug', message, options?.namespace),
        ...(options?.namespace ? [options] : [])
      );
    }
  }

  /**
   * Info log - reduced in production
   */
  static info(message: string, options?: LogOptions): void {
    if (this.shouldLog('info', options?.sensitive)) {
      console.info(
        this.formatMessage('info', message, options?.namespace),
        ...(options?.namespace ? [options] : [])
      );
    }
  }

  /**
   * Warning log - always shown
   */
  static warn(message: string, options?: LogOptions): void {
    if (this.shouldLog('warn')) {
      console.warn(
        this.formatMessage('warn', message, options?.namespace),
        ...(options?.namespace ? [options] : [])
      );
    }
  }

  /**
   * Error log - always shown, with error tracking integration point
   */
  static error(message: string, error?: Error, options?: LogOptions): void {
    if (this.shouldLog('error')) {
      console.error(
        this.formatMessage('error', message, options?.namespace),
        error,
        ...(options?.namespace ? [options] : [])
      );

      // Integration point for error tracking services (Sentry, LogRocket, etc.)
      if (!isDevelopment && error) {
        this.sendToErrorTracking(error, message, options);
      }
    }
  }

  /**
   * Send error to external tracking service
   * Implement this when you add Sentry or similar
   */
  private static sendToErrorTracking(
    error: Error,
    message: string,
    options?: LogOptions
  ): void {
    // TODO: Integrate with Sentry or similar service
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { namespace: options?.namespace },
    //     extra: { message, options }
    //   });
    // }
    console.log('[Error Tracking Hook]', { error: error.message, message, options });
  }

  /**
   * Log auth state change (sanitized)
   */
  static logAuthEvent(event: string, userId?: string): void {
    if (isDevelopment) {
      this.info(`Auth event: ${event}`, { 
        namespace: 'Auth',
        sensitive: true 
      });
    } else {
      // Production: only log event type, no user ID
      this.info(`Auth event occurred`, { namespace: 'Auth' });
    }
  }

  /**
   * Log API call (sanitized)
   */
  static logApiCall(endpoint: string, status: number, duration?: number): void {
    if (isDevelopment) {
      const msg = duration 
        ? `API ${endpoint} - ${status} (${duration}ms)`
        : `API ${endpoint} - ${status}`;
      this.debug(msg, { namespace: 'API' });
    }
  }

  /**
   * Log security event (always logged)
   */
  static logSecurityEvent(eventType: string, details?: string): void {
    this.warn(`Security Event: ${eventType}${details ? ` - ${details}` : ''}`, {
      namespace: 'Security',
      sensitive: true
    });
  }
}

export default SecureLogger;
