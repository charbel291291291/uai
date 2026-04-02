// ============================================================================
// UTILITIES INDEX - Centralized exports
// ============================================================================

// Security utilities
export {
  isValidEmail,
  isPasswordStrong,
  isValidUsername,
  isValidUrl,
  containsSQLInjection,
  containsXSS,
  isInputSafe,
  sanitizeHTML,
  sanitizeInput,
  sanitizeObject,
  generateCSRFToken,
  validateCSRFToken,
  failedAttemptTracker,
  generateRequestFingerprint,
  getContentSecurityPolicy,
  validateFileUpload,
  detectSessionAnomalies,
  generateSecureRandomString,
} from './security';

export type { UploadValidation } from './security';

// Rate limiting
export {
  RateLimitPresets,
  createRateLimiter,
  rateLimit,
  RateLimitError,
} from './rateLimiter';

export type { RateLimitConfig, RateLimitStore } from './rateLimiter';

// Security configuration
export {
  securityConfig,
  getRateLimitConfig,
  isSecurityFeatureEnabled,
} from './securityConfig';
