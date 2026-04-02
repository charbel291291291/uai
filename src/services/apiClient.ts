import { getSupabase } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { 
  isInputSafe, 
  sanitizeObject,
  failedAttemptTracker,
  generateSecureRandomString,
} from '../utils/security';
import { securityConfig, getRateLimitConfig } from '../utils/securityConfig';
import { RateLimitError, createRateLimiter } from '../utils/rateLimiter';

// ============================================================================
// API CLIENT - Base configuration and error handling with security
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
  rateLimit?: {
    remaining: number;
    resetTime: number | null;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
  retryAfter?: number; // For rate limit errors
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Security audit logger
class SecurityAuditLogger {
  static log(event: {
    type: string;
    identifier?: string;
    endpoint?: string;
    details?: any;
  }): void {
    if (!securityConfig.audit.enabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ...event,
    };

    // Log failed attempts if enabled
    if (securityConfig.audit.logSecurityEvents) {
      console.warn('[Security Audit]', JSON.stringify(logEntry));
    }
  }

  static logFailedAttempt(identifier: string, endpoint: string, reason: string): void {
    if (securityConfig.audit.logFailedAttempts) {
      this.log({
        type: 'FAILED_ATTEMPT',
        identifier,
        endpoint,
        details: { reason },
      });
    }
  }

  static logRateLimit(identifier: string, endpoint: string): void {
    if (securityConfig.audit.logRateLimits) {
      this.log({
        type: 'RATE_LIMIT_HIT',
        identifier,
        endpoint,
      });
    }
  }
}

// Singleton API client with security features
class SecureApiClient {
  private static instance: SecureApiClient;
  private client: SupabaseClient;
  private rateLimiters: Map<string, ReturnType<typeof createRateLimiter>> = new Map();

  private constructor() {
    this.client = getSupabase();
  }

  static getInstance(): SecureApiClient {
    if (!SecureApiClient.instance) {
      SecureApiClient.instance = new SecureApiClient();
    }
    return SecureApiClient.instance;
  }

  get supabase(): SupabaseClient {
    return this.client;
  }

  /**
   * Get or create rate limiter for endpoint
   */
  private getRateLimiter(endpointType: string) {
    if (!this.rateLimiters.has(endpointType)) {
      const config = getRateLimitConfig(endpointType as any);
      if (config) {
        this.rateLimiters.set(endpointType, createRateLimiter(config));
      }
    }
    return this.rateLimiters.get(endpointType);
  }

  /**
   * Check rate limit for operation
   */
  checkRateLimit(identifier: string, endpointType: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number | null;
  } {
    if (!securityConfig.rateLimiting.enabled) {
      return { allowed: true, remaining: Infinity, resetTime: null };
    }

    const limiter = this.getRateLimiter(endpointType);
    
    if (!limiter) {
      return { allowed: true, remaining: Infinity, resetTime: null };
    }

    const allowed = limiter.check(identifier);
    const remaining = limiter.getRemaining(identifier);
    const resetTime = limiter.getResetTime(identifier);

    if (!allowed) {
      SecurityAuditLogger.logRateLimit(identifier, endpointType);
    }

    return { allowed, remaining, resetTime };
  }

  /**
   * Validate input data
   */
  validateInput(data: any, options?: { allowHTML?: boolean }): boolean {
    if (!securityConfig.inputValidation.enabled) {
      return true;
    }

    if (typeof data === 'string') {
      return isInputSafe(data, options);
    }

    if (typeof data === 'object' && data !== null) {
      const values = Object.values(data);
      return values.every(value => 
        typeof value !== 'string' || isInputSafe(value, options)
      );
    }

    return true;
  }

  /**
   * Sanitize input data
   */
  sanitizeInput<T extends Record<string, any>>(data: T): T {
    if (!securityConfig.inputValidation.enabled) {
      return data;
    }
    return sanitizeObject(data);
  }

  /**
   * Handle brute force protection
   */
  checkBruteForce(identifier: string): {
    allowed: boolean;
    remainingAttempts: number;
    lockoutTime?: number;
  } {
    if (!securityConfig.bruteForceProtection.enabled) {
      return { allowed: true, remainingAttempts: Infinity };
    }

    const lockoutInfo = failedAttemptTracker.isLockedOut(identifier);
    
    if (lockoutInfo.locked) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutTime: lockoutInfo.remainingTime,
      };
    }

    return {
      allowed: true,
      remainingAttempts: failedAttemptTracker.getRemainingAttempts(identifier),
    };
  }

  /**
   * Record failed attempt for brute force protection
   */
  recordFailedAttempt(identifier: string): void {
    failedAttemptTracker.recordFailed(identifier);
  }

  /**
   * Reset failed attempts (e.g., after successful login)
   */
  resetFailedAttempts(identifier: string): void {
    failedAttemptTracker.reset(identifier);
  }

  /**
   * Generic error handler with security enhancements
   */
  handleError(error: any, identifier?: string, endpoint?: string): ApiError {
    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      return {
        message: error.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: error.retryAfter,
      };
    }

    // Handle brute force lockout
    if (error instanceof BruteForceError) {
      return {
        message: error.message,
        code: 'BRUTE_FORCE_PROTECTED',
        retryAfter: error.lockoutTime,
      };
    }

    // Standard error handling
    if (error instanceof ApiClientError) {
      return {
        message: error.message,
        code: error.code,
        details: error.details,
        retryAfter: error.retryAfter,
      };
    }

    if (error?.code) {
      return {
        message: error.message || 'Database error occurred',
        code: error.code,
        details: error.details,
      };
    }

    return {
      message: error?.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }

  /**
   * Wrap response in standard format with rate limit info
   */
  createResponse<T>(
    data: T | null, 
    error: any,
    rateLimitInfo?: { remaining: number; resetTime: number | null }
  ): ApiResponse<T> {
    const response: ApiResponse<T> = {
      data,
      error: null,
      success: true,
    };

    if (rateLimitInfo) {
      response.rateLimit = rateLimitInfo;
    }

    if (error) {
      response.success = false;
      response.error = this.handleError(error);
    }

    return response;
  }

  /**
   * Execute operation with security checks
   */
  async executeWithSecurity<T>(
    operation: () => Promise<T>,
    options: {
      identifier: string;
      endpointType: string;
      validateInput?: any;
      isSensitive?: boolean;
    }
  ): Promise<ApiResponse<T>> {
    const { identifier, endpointType, validateInput, isSensitive } = options;

    // Check brute force protection for sensitive operations
    if (isSensitive) {
      const bruteForceCheck = this.checkBruteForce(identifier);
      if (!bruteForceCheck.allowed) {
        throw new BruteForceError(
          `Too many failed attempts. Try again in ${Math.ceil((bruteForceCheck.lockoutTime || 0) / 60)} minutes.`,
          bruteForceCheck.lockoutTime || 0
        );
      }
    }

    // Check rate limit
    const rateLimitCheck = this.checkRateLimit(identifier, endpointType);
    if (!rateLimitCheck.allowed) {
      const retryAfter = Math.ceil(((rateLimitCheck.resetTime || 0) - Date.now()) / 1000);
      throw new RateLimitError('Rate limit exceeded', retryAfter);
    }

    // Validate input if provided
    if (validateInput && !this.validateInput(validateInput)) {
      SecurityAuditLogger.logFailedAttempt(identifier, endpointType, 'Invalid input detected');
      throw new ApiClientError(
        'Invalid input detected',
        'INVALID_INPUT',
        { field: Object.keys(validateInput)[0] }
      );
    }

    try {
      const result = await operation();
      
      // Reset failed attempts on success for sensitive operations
      if (isSensitive) {
        this.resetFailedAttempts(identifier);
      }

      return this.createResponse(result, null, {
        remaining: rateLimitCheck.remaining,
        resetTime: rateLimitCheck.resetTime,
      });
    } catch (error: any) {
      // Record failed attempt for sensitive operations
      if (isSensitive) {
        this.recordFailedAttempt(identifier);
        SecurityAuditLogger.logFailedAttempt(
          identifier, 
          endpointType, 
          error?.message || 'Operation failed'
        );
      }

      return this.createResponse(null, error, {
        remaining: rateLimitCheck.remaining,
        resetTime: rateLimitCheck.resetTime,
      });
    }
  }
}

/**
 * Custom error for brute force protection
 */
export class BruteForceError extends Error {
  constructor(
    message: string,
    public lockoutTime: number // milliseconds until retry
  ) {
    super(message);
    this.name = 'BruteForceError';
  }
}

export const apiClient = SecureApiClient.getInstance();
export default apiClient;
export { SecurityAuditLogger };
