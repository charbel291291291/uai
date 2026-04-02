# Error Handling System - Testing Guide

## Problem Summary

Tests were failing with error: `"Cannot find module '../src/error-handling-system'"`

**Root Cause:** Tests were incorrectly mocking `error-handling-system` as a single module, but:
- `useToast` is exported from `ToastContext.tsx`
- `ApiErrorHandler` is exported from `ApiErrorHandler.tsx`
- These are separate modules that need to be mocked individually

## Solution

### 1. Fixed Mock Paths in Test Files

#### ❌ INCORRECT (Old Pattern)
```typescript
jest.mock('../src/error-handling-system', () => ({
  useToast: () => ({ /* ... */ }),
  ApiErrorHandler: jest.fn(),
}));
```

#### ✅ CORRECT (New Pattern)
```typescript
// Mock ToastContext for useToast
jest.mock('../src/error-handling-system/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    dismissAll: jest.fn(),
  }),
}));

// Mock ApiErrorHandler separately if needed
jest.mock('../src/error-handling-system/ApiErrorHandler', () => ({
  ApiErrorHandler: jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
  })),
  useApiErrorHandler: jest.fn(),
}));
```

### 2. Updated Configuration Files

#### tsconfig.test.json
Added path alias for easier imports:
```json
{
  "compilerOptions": {
    "paths": {
      "@error-handling/*": ["src/error-handling-system/*"]
    }
  }
}
```

#### jest.config.js
Added module name mapper:
```javascript
moduleNameMapper: {
  '^@error-handling/(.*)$': '<rootDir>/src/error-handling-system/$1',
}
```

### 3. Improved Testability with Dependency Injection

The `ApiErrorHandler` constructor now accepts an optional toast function:

```typescript
// Before (hard to test)
const handler = new ApiErrorHandler();

// After (easy to test with DI)
const mockToast = jest.fn();
const handler = new ApiErrorHandler({}, mockToast);
```

### 4. Test Utilities

Created `src/error-handling-system/test-utils.ts` with helpers:

```typescript
import { createMockToast, createTestableErrorHandler } from './test-utils';

// Use in tests
const mockToast = createMockToast();
const handler = createTestableErrorHandler(mockToast);
```

## Files Modified

### Test Files
- ✅ `__tests__/auth.test.tsx` - Fixed ToastContext mock
- ✅ `__tests__/api-calls.test.ts` - Fixed ToastContext and ApiErrorHandler mocks
- ✅ `__tests__/ai-chat.test.tsx` - Fixed ToastContext and useApi mocks

### Configuration Files
- ✅ `tsconfig.test.json` - Added @error-handling path alias
- ✅ `jest.config.js` - Added module name mapper

### Source Files
- ✅ `src/error-handling-system/ApiErrorHandler.ts` - Added dependency injection support
- ✅ `src/error-handling-system/test-utils.ts` - Created test utilities

## Usage Examples

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';

// Mock toast context
jest.mock('../src/error-handling-system/ToastContext', () => ({
  useToast: () => ({
    error: jest.fn(),
    success: jest.fn(),
  }),
}));

describe('MyComponent', () => {
  it('should show error toast on API failure', async () => {
    render(<MyComponent />);
    // Your test logic
  });
});
```

### Advanced Test with Custom Handler

```typescript
import { ApiErrorHandler } from '../src/error-handling-system/ApiErrorHandler';

describe('API Error Handling', () => {
  it('should handle network errors', () => {
    const mockToast = jest.fn();
    const handler = new ApiErrorHandler({}, mockToast);
    
    const error = new TypeError('Failed to fetch');
    handler.handleError(error);
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      message: expect.stringContaining('Network'),
    });
  });
});
```

### Using Path Aliases

```typescript
// Instead of long relative paths
import { useToast } from '../../../src/error-handling-system/ToastContext';

// Use clean aliases
import { useToast } from '@error-handling/ToastContext';
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.tsx

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Common Patterns

### Pattern 1: Simple Toast Mock
```typescript
jest.mock('@error-handling/ToastContext', () => ({
  useToast: () => ({
    error: jest.fn(),
  }),
}));
```

### Pattern 2: Custom Toast Implementation
```typescript
const mockError = jest.fn();
jest.mock('@error-handling/ToastContext', () => ({
  useToast: () => ({
    error: mockError,
  }),
}));

// Then in your test
expect(mockError).toHaveBeenCalledWith(expect.objectContaining({
  title: 'Error',
}));
```

### Pattern 3: Testing ApiErrorHandler Directly
```typescript
import { ApiErrorHandler } from '@error-handling/ApiErrorHandler';

const mockToast = jest.fn();
const handler = new ApiErrorHandler({}, mockToast);

handler.handleError({ response: { status: 500 } });

expect(mockToast).toHaveBeenCalled();
```

## Migration Checklist

For existing test files:

- [ ] Replace `jest.mock('../src/error-handling-system')` with specific module paths
- [ ] Update imports to use `@error-handling/*` alias (optional)
- [ ] Remove any inline mock implementations
- [ ] Add proper type annotations for toast callbacks
- [ ] Use dependency injection where possible
- [ ] Update any custom error handlers to match new signature

## Best Practices

1. **Always mock at the top level** - Never call `jest.mock()` inside a test
2. **Clear mocks between tests** - Use `beforeEach(() => jest.clearAllMocks())`
3. **Use specific paths** - Mock exact modules, not parent directories
4. **Prefer DI over globals** - Pass dependencies as constructor parameters
5. **Keep mocks minimal** - Only mock what you need for the test
6. **Type your mocks** - Ensure mock signatures match real implementations

## Troubleshooting

### Error: "Cannot find module"
✅ Check that you're using the correct path:
- `ToastContext` → `../src/error-handling-system/ToastContext`
- `ApiErrorHandler` → `../src/error-handling-system/ApiErrorHandler`

### Error: "useToast is not a function"
✅ Make sure you're mocking the return value correctly:
```typescript
useToast: () => ({ error: jest.fn() })
```

### Type mismatch with showToast
✅ The signature is now:
```typescript
(options: { title: string; message?: string; retry?: () => Promise<void> }) => void
```

## Additional Resources

- Example test file: `__tests__/error-handling-example.test.tsx`
- Test utilities: `src/error-handling-system/test-utils.ts`
- Jest documentation: https://jestjs.io/docs/mock-functions
- Testing Library: https://testing-library.com/docs/react-testing-library/intro/
