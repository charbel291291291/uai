# Security Setup Quick Start

This guide helps you quickly set up and configure security features for your UAi application.

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
npm install dompurify
```

### Step 2: Security is Already Enabled!

All security features are **enabled by default** in the updated services. No additional configuration required.

### Step 3: Test Security Features

```typescript
import { authService } from '@/services';
import { isValidEmail, isPasswordStrong } from '@/utils';

// Test rate limiting - try 6 logins in 15 minutes
await authService.signIn({ 
  email: 'test@example.com', 
  password: 'wrong' 
});

// Test input validation
console.log(isValidEmail('invalid')); // false
console.log(isPasswordStrong('weak').valid); // false
```

## 🔧 Configuration (Optional)

### Customize Rate Limits

Edit `src/utils/securityConfig.ts`:

```typescript
rateLimiting: {
  auth: {
    windowMs: 15 * 60 * 1000,  // Change to 30 min
    maxRequests: 5,             // Change to 10 attempts
  },
}
```

### Adjust Password Requirements

Edit `src/utils/security.ts`:

```typescript
export function isPasswordStrong(password: string) {
  const issues: string[] = [];
  
  if (password.length < 12) {  // Increase from 8 to 12
    issues.push('Password must be at least 12 characters');
  }
  
  // Add more requirements...
}
```

## 📊 What's Protected

### Automatically Protected (No Code Changes)

✅ **Authentication Endpoints**
- Login: 5 attempts per 15 minutes
- Signup: 5 attempts per 15 minutes  
- Password reset: 3 attempts per hour

✅ **API Calls**
- General API: 30 requests per minute
- Profile updates: 5 per minute
- AI chat: 10 messages per minute

✅ **Input Validation**
- SQL injection detection
- XSS prevention
- Email format validation
- Password strength checks

✅ **Brute Force Protection**
- Automatic lockout after 5 failed attempts
- 15-minute cooldown period

## 🎯 Using Security Features

### Rate Limiting in Your Code

```typescript
import { createRateLimiter, RateLimitPresets } from '@/utils';

const limiter = createRateLimiter(RateLimitPresets.api);

async function myApiCall() {
  if (!limiter.check(userId)) {
    throw new Error('Rate limit exceeded');
  }
  
  // Your code here
}
```

### Input Validation

```typescript
import { isValidEmail, sanitizeInput, isInputSafe } from '@/utils';

// Validate email
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}

// Sanitize input
const clean = sanitizeInput(userInput);

// Check for malicious content
if (!isInputSafe(input)) {
  console.warn('Potentially dangerous input detected');
}
```

### Brute Force Protection

```typescript
import { failedAttemptTracker } from '@/utils';

// In your login handler
try {
  await authenticate(credentials);
  failedAttemptTracker.reset(userId); // Success - reset counter
} catch (error) {
  failedAttemptTracker.recordFailed(userId); // Record failure
  
  const { locked, remainingTime } = failedAttemptTracker.isLockedOut(userId);
  if (locked) {
    throw new Error(`Try again in ${Math.ceil(remainingTime / 60)} minutes`);
  }
}
```

## 📈 Monitoring

### View Security Logs

Security events are logged to console by default:

```bash
# Run your app and watch for:
[Security Audit] {"type":"FAILED_ATTEMPT","identifier":"auth:user@example.com",...}
[Security Audit] {"type":"RATE_LIMIT_HIT","identifier":"auth:user@example.com",...}
```

### Enable Detailed Logging

In `src/utils/securityConfig.ts`:

```typescript
audit: {
  enabled: true,
  logFailedAttempts: true,
  logRateLimits: true,
  logSecurityEvents: true,
}
```

## 🛡️ Production Checklist

Before deploying:

- [ ] Test rate limiting works as expected
- [ ] Verify brute force protection activates
- [ ] Confirm input validation catches bad data
- [ ] Review and adjust rate limit thresholds
- [ ] Set up monitoring/alerting for security events
- [ ] Configure CSP headers if needed
- [ ] Test file upload restrictions
- [ ] Verify HTTPS is enforced

## 🆘 Troubleshooting

### "Too many requests" appearing too often

**Solution:** Increase rate limits in `securityConfig.ts`

```typescript
api: {
  windowMs: 2 * 60 * 1000,  // 2 minutes instead of 1
  maxRequests: 60,           // 60 requests instead of 30
}
```

### Users getting locked out unfairly

**Solution:** Increase brute force threshold

```typescript
bruteForceProtection: {
  maxAttempts: 10,  // Instead of 5
  lockoutDuration: 10 * 60 * 1000,  // 10 minutes instead of 15
}
```

### Legitimate input flagged as malicious

**Solution:** Adjust validation or add exceptions

```typescript
// For specific fields that need special characters
const sanitized = sanitizeInput(input, { allowSpecialChars: true });
```

## 📚 Learn More

- **[docs/SECURITY.md](docs/SECURITY.md)** - Complete security documentation
- **[docs/API.md](docs/API.md)** - API reference with security notes
- **[docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)** - Best practices

## 🔐 Security Features Summary

| Feature | Status | Configuration |
|---------|--------|---------------|
| Rate Limiting | ✅ Enabled | `securityConfig.rateLimiting` |
| Brute Force Protection | ✅ Enabled | `securityConfig.bruteForceProtection` |
| Input Validation | ✅ Enabled | `securityConfig.inputValidation` |
| XSS Protection | ✅ Enabled | Via DOMPurify |
| SQL Injection Detection | ✅ Enabled | Built-in |
| CSRF Tokens | ✅ Available | `generateCSRFToken()` |
| File Upload Validation | ✅ Available | `validateFileUpload()` |
| Audit Logging | ✅ Enabled | `securityConfig.audit` |

---

**Need help?** See [docs/SECURITY.md](docs/SECURITY.md) for detailed documentation.
