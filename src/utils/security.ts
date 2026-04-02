// ============================================================================
// SECURITY UTILITIES - Input validation, sanitization, and protection
// ============================================================================

import DOMPurify from 'dompurify';

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
 */
export function isPasswordStrong(password: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain at least one number');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validate username format
 * Allow only alphanumeric and underscores, 3-20 characters
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
  return usernameRegex.test(username);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check for SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    /(--|\#|\/\*|\*\/)/,  // SQL comments
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,  // OR 1=1 patterns
    /('\s*(OR|AND)\s*')/i,
    /(;\s*(DROP|DELETE|UPDATE))/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate input doesn't contain malicious content
 */
export function isInputSafe(input: string, options?: { allowHTML?: boolean }): boolean {
  if (!input || typeof input !== 'string') {
    return true;
  }

  // Check for SQL injection
  if (containsSQLInjection(input)) {
    return false;
  }

  // Check for XSS
  if (!options?.allowHTML && containsXSS(input)) {
    return false;
  }

  // Check for null bytes
  if (input.includes('\0')) {
    return false;
  }

  // Check for excessive length (potential DoS)
  if (input.length > 10000) {
    return false;
  }

  return true;
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize HTML string
 */
export function sanitizeHTML(html: string): string {
  if (DOMPurify && typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
    });
  }
  // Fallback - strip all HTML tags
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user input - trim and escape
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '')  // Remove angle brackets
    .slice(0, 1000);        // Limit length
}

/**
 * Sanitize object properties
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value) as unknown as T[ keyof T];
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as any);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token (constant-time comparison)
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// BRUTE FORCE PROTECTION
// ============================================================================

/**
 * Track failed login attempts
 */
class FailedAttemptTracker {
  private attempts: Map<string, { count: number; lockUntil: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly lockoutDuration: number;

  constructor(maxAttempts: number = 5, lockoutDuration: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.lockoutDuration = lockoutDuration;
    
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Record a failed attempt
   */
  recordFailed(identifier: string): void {
    const now = Date.now();
    const existing = this.attempts.get(identifier);

    if (!existing || now > existing.lockUntil) {
      this.attempts.set(identifier, {
        count: 1,
        lockUntil: now + this.lockoutDuration,
      });
    } else {
      this.attempts.set(identifier, {
        count: existing.count + 1,
        lockUntil: existing.lockUntil,
      });
    }
  }

  /**
   * Check if identifier is locked out
   */
  isLockedOut(identifier: string): { locked: boolean; remainingTime?: number } {
    const existing = this.attempts.get(identifier);

    if (!existing) {
      return { locked: false };
    }

    const now = Date.now();
    
    if (now > existing.lockUntil) {
      this.attempts.delete(identifier);
      return { locked: false };
    }

    if (existing.count >= this.maxAttempts) {
      return {
        locked: true,
        remainingTime: Math.ceil((existing.lockUntil - now) / 1000),
      };
    }

    return { locked: false };
  }

  /**
   * Reset attempts for identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(identifier: string): number {
    const existing = this.attempts.get(identifier);
    const lockoutInfo = this.isLockedOut(identifier);
    
    if (lockoutInfo.locked) {
      return 0;
    }

    return existing ? this.maxAttempts - existing.count : this.maxAttempts;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [identifier, data] of this.attempts.entries()) {
      if (now > data.lockUntil) {
        this.attempts.delete(identifier);
      }
    }
  }
}

// Singleton instance
export const failedAttemptTracker = new FailedAttemptTracker();

// ============================================================================
// REQUEST FINGERPRINTING
// ============================================================================

/**
 * Generate a fingerprint for request identification
 */
export function generateRequestFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    `${screen.width}x${screen.height}`,
  ];

  const fingerprint = components.join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `fp_${Math.abs(hash).toString(16)}`;
}

// ============================================================================
// SECURITY HEADERS HELPERS
// ============================================================================

/**
 * Get recommended security headers for CSP
 */
export function getContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/**
 * Validate file upload
 */
export interface UploadValidation {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

export function validateFileUpload(
  file: File,
  options?: {
    allowedTypes?: string[];
    maxSizeMB?: number;
  }
): UploadValidation {
  const allowedTypes = options?.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'];
  const maxSizeMB = options?.maxSizeMB || 5;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  // Sanitize filename
  const sanitizedFilename = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase();

  return {
    valid: true,
    sanitizedFilename,
  };
}

// ============================================================================
// SESSION SECURITY
// ============================================================================

/**
 * Check if session might be compromised
 */
export function detectSessionAnomalies(
  currentFingerprint: string,
  storedFingerprint?: string
): boolean {
  if (!storedFingerprint) {
    return false; // No previous fingerprint to compare
  }

  // Different fingerprint might indicate session hijacking
  return currentFingerprint !== storedFingerprint;
}

/**
 * Secure random string generator
 */
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}
