// ============================================================================
// RATE LIMITER - Prevent abuse and spam
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;    // Max requests per window
  message: string;        // Error message when limit exceeded
}

export interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Default configurations for different use cases
export const RateLimitPresets = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000,      // 15 minutes
    maxRequests: 5,                 // 5 attempts
    message: 'Too many authentication attempts. Please try again later.',
  },
  
  // Moderate limits for API calls
  api: {
    windowMs: 60 * 1000,           // 1 minute
    maxRequests: 30,                // 30 requests per minute
    message: 'Too many requests. Please slow down.',
  },
  
  // Lenient limits for read operations
  read: {
    windowMs: 60 * 1000,           // 1 minute
    maxRequests: 100,               // 100 requests per minute
    message: 'Rate limit exceeded for read operations.',
  },
  
  // Very strict for password reset
  sensitive: {
    windowMs: 60 * 60 * 1000,      // 1 hour
    maxRequests: 3,                 // 3 attempts per hour
    message: 'Too many sensitive operations. Please wait an hour.',
  },
  
  // AI chat specific limits
  aiChat: {
    windowMs: 60 * 1000,           // 1 minute
    maxRequests: 10,                // 10 messages per minute
    message: 'You\'re sending messages too fast. Please wait a moment.',
  },
  
  // Contact form / messages
  contact: {
    windowMs: 60 * 60 * 1000,      // 1 hour
    maxRequests: 5,                 // 5 messages per hour
    message: 'Too many messages sent. Please wait before sending more.',
  },
};

// In-memory store (for client-side rate limiting)
class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup old entries every minute
    this.startCleanup();
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (user ID, IP, etc.)
   * @param config - Rate limit configuration
   * @returns True if allowed, false if rate limited
   */
  isAllowed(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = this.store[identifier];

    // No existing record - allow and create record
    if (!record) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return true;
    }

    // Window expired - reset
    if (now > record.resetTime) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return true;
    }

    // Within limit - allow
    if (record.count < config.maxRequests) {
      this.store[identifier].count++;
      return true;
    }

    // Rate limited
    return false;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string, config: RateLimitConfig): number {
    const record = this.store[identifier];
    if (!record || Date.now() > record.resetTime) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - record.count);
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number | null {
    const record = this.store[identifier];
    return record ? record.resetTime : null;
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    delete this.store[identifier];
  }

  /**
   * Clear all records
   */
  clear(): void {
    this.store = {};
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach((key) => {
        if (now > this.store[key].resetTime) {
          delete this.store[key];
        }
      });
    }, 60 * 1000); // Clean up every minute
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
const globalRateLimiter = new RateLimiter();

/**
 * Create a rate limit checker with custom config
 */
export function createRateLimiter(config: RateLimitConfig) {
  return {
    check: (identifier: string): boolean => {
      return globalRateLimiter.isAllowed(identifier, config);
    },
    
    getRemaining: (identifier: string): number => {
      return globalRateLimiter.getRemaining(identifier, config);
    },
    
    getResetTime: (identifier: string): number | null => {
      return globalRateLimiter.getResetTime(identifier);
    },
    
    reset: (identifier: string): void => {
      globalRateLimiter.reset(identifier);
    },
  };
}

/**
 * Decorator for rate limiting async functions
 */
export function rateLimit<T extends (...args: any[]) => Promise<any>>(
  config: RateLimitConfig,
  identifierFn?: (...args: Parameters<T>) => string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const limiter = createRateLimiter(config);

    descriptor.value = async function (...args: any[]) {
      // Generate identifier from arguments or use default
      const identifier = identifierFn 
        ? identifierFn(...args)
        : `default-${propertyKey}`;

      if (!limiter.check(identifier)) {
        const resetTime = limiter.getResetTime(identifier);
        const retryAfter = resetTime 
          ? Math.ceil((resetTime - Date.now()) / 1000)
          : 60;

        throw new RateLimitError(config.message, retryAfter);
      }

      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Don't count errors against rate limit
        limiter.reset(identifier);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number // seconds until retry
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export default globalRateLimiter;
