# UAi Security Guide

Comprehensive guide to security features, best practices, and protection mechanisms in the UAi platform.

## Table of Contents

- [Overview](#overview)
- [Security Features](#security-features)
- [Rate Limiting](#rate-limiting)
- [Input Validation](#input-validation)
- [Brute Force Protection](#brute-force-protection)
- [API Security](#api-security)
- [Best Practices](#best-practices)
- [Configuration](#configuration)
- [Monitoring & Auditing](#monitoring--auditing)

---

## Overview

The UAi platform includes comprehensive security measures to protect against common web vulnerabilities, spam, and abuse. All security features are enabled by default and require minimal configuration.

### Key Security Principles

1. **Defense in Depth**: Multiple layers of security
2. **Fail Secure**: Errors don't expose sensitive information
3. **Least Privilege**: Minimum necessary permissions
4. **Secure by Default**: Safe configurations out of the box

---

## Security Features

### 1. Rate Limiting

Prevents abuse by limiting request frequency.

**Protected Endpoints:**
- Authentication (login, signup): 5 requests per 15 minutes
- Password reset: 3 requests per hour
- API calls: 30 requests per minute
- AI chat: 10 messages per minute
- Contact forms: 5 messages per hour

**Example:**
```typescript
import { createRateLimiter, RateLimitPresets } from '@/utils';

const authLimiter = createRateLimiter(RateLimitPresets.auth);

if (!authLimiter.check(userId)) {
  throw new Error('Too many attempts. Please wait.');
}
```

### 2. Input Validation & Sanitization

Protects against injection attacks and malicious input.

**Validations:**
- Email format validation
- Password strength requirements
- Username format checks
- SQL injection detection
- XSS pattern detection
- Input length limits

**Example:**
```typescript
import { 
  isValidEmail, 
  isPasswordStrong,
  sanitizeInput,
  isInputSafe 
} from '@/utils';

// Validate email
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}

// Check password strength
const strength = isPasswordStrong(password);
if (!strength.valid) {
  console.log(strength.issues);
}

// Sanitize input
const clean = sanitizeInput(userInput);

// Check if input is safe
if (!isInputSafe(input)) {
  throw new Error('Potentially malicious input detected');
}
```

### 3. Brute Force Protection

Automatically locks accounts after failed login attempts.

**Settings:**
- Max attempts: 5
- Lockout duration: 15 minutes
- Automatic cleanup of expired lockouts

**Example:**
```typescript
import { failedAttemptTracker } from '@/utils';

// Record failed attempt
failedAttemptTracker.recordFailed(userId);

// Check if locked out
const { locked, remainingTime } = failedAttemptTracker.isLockedOut(userId);

if (locked) {
  console.log(`Try again in ${remainingTime} seconds`);
}

// Reset after successful login
failedAttemptTracker.reset(userId);
```

### 4. CSRF Protection

Cross-Site Request Forgery tokens for form submissions.

**Example:**
```typescript
import { generateCSRFToken, validateCSRFToken } from '@/utils';

// Generate token
const token = generateCSRFToken();

// Validate token
if (!validateCSRFToken(submittedToken, storedToken)) {
  throw new Error('Invalid CSRF token');
}
```

### 5. File Upload Security

Validates uploaded files to prevent malicious uploads.

**Checks:**
- File type validation
- File size limits
- Filename sanitization

**Example:**
```typescript
import { validateFileUpload } from '@/utils';

const validation = validateFileUpload(file, {
  allowedTypes: ['image/jpeg', 'image/png'],
  maxSizeMB: 5,
});

if (!validation.valid) {
  console.error(validation.error);
} else {
  console.log('Sanitized filename:', validation.sanitizedFilename);
}
```

---

## Rate Limiting

### Preset Configurations

```typescript
import { RateLimitPresets, createRateLimiter } from '@/utils';

// Authentication (strict)
const authLimiter = createRateLimiter(RateLimitPresets.auth);
// windowMs: 15 minutes, maxRequests: 5

// General API
const apiLimiter = createRateLimiter(RateLimitPresets.api);
// windowMs: 1 minute, maxRequests: 30

// AI Chat
const chatLimiter = createRateLimiter(RateLimitPresets.aiChat);
// windowMs: 1 minute, maxRequests: 10

// Sensitive operations
const sensitiveLimiter = createRateLimiter(RateLimitPresets.sensitive);
// windowMs: 1 hour, maxRequests: 3
```

### Custom Rate Limits

```typescript
import { createRateLimiter } from '@/utils';

const customLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,      // 5 minutes
  maxRequests: 20,               // 20 requests
  message: 'Custom rate limit exceeded',
});

if (!customLimiter.check(identifier)) {
  const resetTime = customLimiter.getResetTime(identifier);
  const retryAfter = Math.ceil((resetTime! - Date.now()) / 1000);
  throw new Error(`Retry after ${retryAfter} seconds`);
}
```

### Using with Services

Services automatically apply rate limiting:

```typescript
import { authService } from '@/services';

// Automatically rate limited and brute-force protected
const { data, error, rateLimit } = await authService.signIn({
  email: 'user@example.com',
  password: 'password123',
});

if (error?.code === 'RATE_LIMIT_EXCEEDED') {
  console.log('Retry after:', error.retryAfter, 'seconds');
}

console.log('Remaining attempts:', rateLimit?.remaining);
```

---

## Input Validation

### Email Validation

```typescript
import { isValidEmail } from '@/utils';

if (!isValidEmail('test@example.com')) {
  throw new Error('Invalid email format');
}
```

### Password Strength

```typescript
import { isPasswordStrong } from '@/utils';

const result = isPasswordStrong('MyP@ssw0rd');

if (!result.valid) {
  console.log('Password issues:', result.issues);
  // ["Password must be at least 8 characters long", ...]
}
```

### Username Validation

```typescript
import { isValidUsername } from '@/utils';

if (!isValidUsername('john_doe123')) {
  throw new Error('Invalid username format');
}
```

### SQL Injection Detection

```typescript
import { containsSQLInjection } from '@/utils';

if (containsSQLInjection(userInput)) {
  console.warn('Potential SQL injection detected');
  // Log and reject input
}
```

### XSS Detection

```typescript
import { containsXSS } from '@/utils';

if (containsXSS('<script>alert("xss")</script>')) {
  console.warn('Potential XSS attack detected');
  // Log and reject input
}
```

### HTML Sanitization

```typescript
import { sanitizeHTML } from '@/utils';

const clean = sanitizeHTML('<p>Safe <b>HTML</b></p>');
// Allows safe tags, removes dangerous ones
```

---

## Brute Force Protection

### Automatic Protection

Authentication endpoints are automatically protected:

```typescript
import { authService } from '@/services';

// After 5 failed attempts, further attempts are blocked
const { error } = await authService.signIn({
  email: 'user@example.com',
  password: 'wrong-password',
});

if (error?.code === 'BRUTE_FORCE_PROTECTED') {
  console.log('Account temporarily locked');
  console.log('Retry after:', error.retryAfter, 'seconds');
}
```

### Manual Tracking

```typescript
import { failedAttemptTracker } from '@/utils';

// Record failed attempt
failedAttemptTracker.recordFailed(userId);

// Check status
const status = failedAttemptTracker.isLockedOut(userId);

if (status.locked) {
  console.log(`Locked for ${status.remainingTime} more seconds`);
}

// Get remaining attempts
const remaining = failedAttemptTracker.getRemainingAttempts(userId);
console.log(`${remaining} attempts remaining`);

// Reset on success
failedAttemptTracker.reset(userId);
```

---

## API Security

### Secure API Client

The API client automatically applies security checks:

```typescript
import { apiClient } from '@/services';

const response = await apiClient.executeWithSecurity(
  async () => {
    // Your operation here
    return await someOperation();
  },
  {
    identifier: userId,           // For rate limiting
    endpointType: 'api',          // Uses preset config
    validateInput: { data },      // Input validation
    isSensitive: false,           // Enable brute force protection
  }
);

// Response includes rate limit info
console.log('Remaining requests:', response.rateLimit?.remaining);
```

### Error Handling

Security-related errors include retry information:

```typescript
try {
  const result = await authService.signIn(credentials);
  
  if (result.error) {
    switch (result.error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        console.log('Too many attempts. Retry after:', result.error.retryAfter);
        break;
        
      case 'BRUTE_FORCE_PROTECTED':
        console.log('Account locked. Retry after:', result.error.retryAfter);
        break;
        
      case 'INVALID_INPUT':
        console.log('Invalid input detected');
        break;
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

---

## Best Practices

### 1. Always Validate Input

```typescript
// ✅ Good: Validate before processing
if (!isValidEmail(email)) {
  throw new ValidationError('Invalid email');
}

// ❌ Bad: No validation
await createUser(email); // Could be malformed
```

### 2. Use Strong Password Requirements

```typescript
// ✅ Good: Enforce strong passwords
const strength = isPasswordStrong(password);
if (!strength.valid) {
  return res.status(400).json({ issues: strength.issues });
}

// ❌ Bad: Weak requirements
if (password.length < 6) { /* Too weak */ }
```

### 3. Implement Rate Limiting Everywhere

```typescript
// ✅ Good: Rate limit all sensitive operations
const limiter = createRateLimiter(RateLimitPresets.auth);
if (!limiter.check(userId)) {
  throw new RateLimitError('Too many attempts');
}

// ❌ Bad: No rate limiting
await loginAttempt(email, password); // Unlimited attempts
```

### 4. Sanitize User Input

```typescript
// ✅ Good: Sanitize before use
const cleanData = sanitizeObject(userData);
await saveProfile(cleanData);

// ❌ Bad: Use raw input
await saveProfile(userData); // Could contain malicious content
```

### 5. Monitor Failed Attempts

```typescript
// ✅ Good: Log and monitor
if (failedAttempts > 3) {
  SecurityAuditLogger.logFailedAttempt(userId, 'login');
  alertAdmin(userId);
}

// ❌ Bad: Ignore patterns
// No monitoring of failed attempts
```

### 6. Use Secure Headers

```typescript
// In your server configuration
headers: {
  'Content-Security-Policy': getContentSecurityPolicy(),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
}
```

---

## Configuration

### Security Settings

Configure security features in `securityConfig.ts`:

```typescript
export const securityConfig = {
  rateLimiting: {
    enabled: true,
    auth: {
      windowMs: 15 * 60 * 1000,  // 15 minutes
      maxRequests: 5,             // 5 attempts
    },
    // ... more configs
  },
  
  bruteForceProtection: {
    enabled: true,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
  },
  
  inputValidation: {
    enabled: true,
    maxLength: {
      default: 1000,
      bio: 500,
      // ...
    },
  },
};
```

### Environment Variables

```env
# Security settings
VITE_ENABLE_RATE_LIMITING=true
VITE_ENABLE_BRUTE_FORCE_PROTECTION=true
VITE_ENABLE_INPUT_VALIDATION=true

# CSP (optional)
VITE_CSP_ENABLED=true
```

---

## Monitoring & Auditing

### Security Audit Logger

```typescript
import { SecurityAuditLogger } from '@/services/apiClient';

// Log security events
SecurityAuditLogger.log({
  type: 'FAILED_LOGIN',
  identifier: userId,
  endpoint: '/auth/signin',
  details: { reason: 'Invalid password' },
});

// Log rate limit hits
SecurityAuditLogger.logRateLimit(userId, 'auth');

// Log failed attempts
SecurityAuditLogger.logFailedAttempt(userId, 'signin', 'Invalid credentials');
```

### Audit Configuration

```typescript
// Enable/disable audit logging
audit: {
  enabled: true,
  logFailedAttempts: true,
  logRateLimits: true,
  logSecurityEvents: true,
}
```

### Monitoring Dashboard

Create a dashboard to monitor:

1. **Failed Login Attempts**
   - Count per hour/day
   - Top offending IPs/users
   
2. **Rate Limit Hits**
   - Which endpoints are hit most
   - Patterns of abuse

3. **Security Events**
   - SQL injection attempts
   - XSS attempts
   - Invalid inputs

---

## Security Checklist

Before deploying to production:

- [ ] Rate limiting enabled on all endpoints
- [ ] Brute force protection active
- [ ] Input validation configured
- [ ] Password strength requirements enforced
- [ ] File upload restrictions in place
- [ ] CSP headers configured
- [ ] Audit logging enabled
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Session timeout configured
- [ ] Error messages don't leak information

---

## Troubleshooting

### Users Locked Out Too Quickly

**Solution:** Increase rate limit thresholds

```typescript
auth: {
  windowMs: 30 * 60 * 1000,  // 30 minutes instead of 15
  maxRequests: 10,            // 10 attempts instead of 5
}
```

### False Positives in Input Validation

**Solution:** Adjust validation patterns or add exceptions

```typescript
// Allow specific HTML tags
sanitizeHTML(input, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
});
```

### Performance Impact

**Solution:** Reduce audit logging verbosity

```typescript
audit: {
  enabled: true,
  logFailedAttempts: false,  // Only log critical events
  logRateLimits: false,
}
```

---

<div align="center">
  <sub>Last updated: April 2026</sub>
</div>
