// ============================================================================
// SECURITY CONFIGURATION - Centralized security settings
// ============================================================================

import type { RateLimitConfig } from './rateLimiter';

/**
 * Security configuration for the application
 */
export const securityConfig = {
  // Rate limiting defaults
  rateLimiting: {
    enabled: true,
    
    // Authentication endpoints (very strict)
    auth: {
      windowMs: 15 * 60 * 1000,  // 15 minutes
      maxRequests: 5,             // 5 attempts
    },
    
    // Password reset (strict)
    passwordReset: {
      windowMs: 60 * 60 * 1000,  // 1 hour
      maxRequests: 3,             // 3 attempts per hour
    },
    
    // General API calls
    api: {
      windowMs: 60 * 1000,       // 1 minute
      maxRequests: 30,            // 30 requests per minute
    },
    
    // AI chat
    aiChat: {
      windowMs: 60 * 1000,       // 1 minute
      maxRequests: 10,            // 10 messages per minute
      dailyLimit: 1000,           // 1000 messages per day
    },
    
    // Contact messages
    contact: {
      windowMs: 60 * 60 * 1000,  // 1 hour
      maxRequests: 5,             // 5 messages per hour
    },
    
    // File uploads
    upload: {
      windowMs: 60 * 60 * 1000,  // 1 hour
      maxRequests: 10,            // 10 uploads per hour
    },
    
    // Profile updates
    profileUpdate: {
      windowMs: 60 * 1000,       // 1 minute
      maxRequests: 5,             // 5 updates per minute
    },
  },

  // Brute force protection
  bruteForceProtection: {
    enabled: true,
    maxAttempts: 5,               // Lock after 5 failed attempts
    lockoutDuration: 15 * 60 * 1000, // 15 minutes lockout
  },

  // Input validation
  inputValidation: {
    enabled: true,
    maxLength: {
      default: 1000,              // Max chars for general input
      bio: 500,                   // Bio field
      message: 2000,              // Message content
      username: 20,               // Username
      displayName: 50,            // Display name
    },
  },

  // File upload restrictions
  fileUpload: {
    enabled: true,
    maxSizeMB: 5,                 // Max file size in MB
    allowedImageTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    allowedDocumentTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  // Session security
  session: {
    checkFingerprint: true,       // Validate session fingerprint
    timeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    absoluteTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // CORS (configured in Supabase/Vite)
  cors: {
    allowedOrigins: [
      import.meta.env.VITE_APP_URL || 'http://localhost:3000',
    ],
    allowCredentials: true,
  },

  // Content Security Policy
  csp: {
    enabled: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://*.supabase.co', 'https://*.googleapis.com'],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },

  // Audit logging
  audit: {
    enabled: true,
    logFailedAttempts: true,
    logRateLimits: true,
    logSecurityEvents: true,
  },
};

/**
 * Get rate limit config for specific endpoint type
 */
export function getRateLimitConfig(type: keyof typeof securityConfig.rateLimiting): RateLimitConfig | null {
  const config = securityConfig.rateLimiting[type];
  
  if (!config || typeof config !== 'object') {
    return null;
  }

  return {
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    message: getRateLimitMessage(type),
  };
}

/**
 * Get appropriate error message for rate limit type
 */
function getRateLimitMessage(type: string): string {
  const messages: Record<string, string> = {
    auth: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    passwordReset: 'Too many password reset requests. Please wait an hour.',
    api: 'Rate limit exceeded. Please slow down your requests.',
    aiChat: 'You\'re sending messages too quickly. Please wait a moment.',
    contact: 'Too many messages sent. Please wait before sending more.',
    upload: 'Upload limit reached. Please try again later.',
    profileUpdate: 'Too many profile updates. Please wait a moment.',
  };

  return messages[type] || 'Rate limit exceeded. Please try again later.';
}

/**
 * Check if a security feature is enabled
 */
export function isSecurityFeatureEnabled(feature: keyof typeof securityConfig): boolean {
  const config = securityConfig[feature];
  
  if (typeof config === 'boolean') {
    return config;
  }
  
  if (config && typeof config === 'object' && 'enabled' in config) {
    return (config as any).enabled !== false;
  }
  
  return true;
}

export default securityConfig;
