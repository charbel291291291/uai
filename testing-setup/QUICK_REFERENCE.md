# Quick Reference - Error Handling Mocks

## 🚀 Quick Copy-Paste

### Basic Setup (Most Common)
```typescript
// At top of your test file
jest.mock('../src/error-handling-system/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    dismissAll: jest.fn(),
  }),
}));
```

### With ApiErrorHandler Override
```typescript
// Mock ToastContext
jest.mock('../src/error-handling-system/ToastContext', () => ({
  useToast: () => ({
    error: jest.fn(),
    success: jest.fn(),
  }),
}));

// Mock ApiErrorHandler (if needed)
jest.mock('../src/error-handling-system/ApiErrorHandler', () => ({
  ApiErrorHandler: jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
  })),
  useApiErrorHandler: jest.fn(),
}));
```

---

## 📦 Import Aliases

After tsconfig update, use:
```typescript
import { useToast } from '@error-handling/ToastContext';
import { ApiErrorHandler } from '@error-handling/ApiErrorHandler';
import { useApi } from '@error-handling/useApi';
```

---

## 🧪 Testing Patterns

### Pattern 1: Component with Toast
```typescript
const mockError = jest.fn();
jest.mock('../src/error-handling-system/ToastContext', () => ({
  useToast: () => ({
    error: mockError,
  }),
}));

// In test
expect(mockError).toHaveBeenCalledWith({
  title: 'Error',
  message: 'Something went wrong',
});
```

### Pattern 2: Direct Handler Test
```typescript
import { ApiErrorHandler } from '@error-handling/ApiErrorHandler';

const mockToast = jest.fn();
const handler = new ApiErrorHandler({}, mockToast);

handler.handleError({ response: { status: 500 } });

expect(mockToast).toHaveBeenCalled();
```

### Pattern 3: Using Test Utils
```typescript
import { createTestableErrorHandler } from '@error-handling/test-utils';

const handler = createTestableErrorHandler();
handler.handleError(new Error('Test'));
```

---

## ✅ Checklist for Each Test File

- [ ] Mock at top level (not inside tests)
- [ ] Use specific module paths
- [ ] Clear mocks in `beforeEach`
- [ ] Type mock functions correctly
- [ ] Only mock what you need

---

## ❌ Common Mistakes

### Wrong
```typescript
jest.mock('../src/error-handling-system', () => ({ /* ❌ */ }));
jest.mock('../../error-handling-system', () => ({ /* ❌ */ }));
```

### Right
```typescript
jest.mock('../src/error-handling-system/ToastContext', () => ({ /* ✅ */ }));
jest.mock('../src/error-handling-system/ApiErrorHandler', () => ({ /* ✅ */ }));
```

---

## 🔧 Troubleshooting

| Error | Fix |
|-------|-----|
| Cannot find module | Check path is to specific file (ToastContext, ApiErrorHandler) |
| useToast is not a function | Make sure mock returns object with methods |
| Type mismatch | Update mock signature to match `{ title, message, retry }` |
| Mock not working | Ensure `jest.mock()` is at top level, not in test |

---

## 📖 Full Documentation

- `ERROR_HANDLING_TESTING_GUIDE.md` - Complete guide
- `FIXES_SUMMARY.md` - All changes made
- `test-utils.ts` - Helper functions
