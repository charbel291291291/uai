# Testing Setup Guide

Complete testing environment setup for the UAi React application using Jest and React Testing Library.

## 📦 Installation

### 1. Install Dependencies

```bash
cd outputs/testing-setup
npm install
```

Or copy the devDependencies to your main project's `package.json`:

```json
{
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "@babel/preset-react": "^7.23.0",
    "@babel/preset-typescript": "^7.23.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "babel-jest": "^29.7.0",
    "identity-obj-proxy": "^3.0.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "jest-watch-typeahead": "^2.2.0",
    "typescript": "^5.0.0"
  }
}
```

### 2. Copy Configuration Files

Copy these files to your project root:

```
jest.config.js
babel.config.js
tsconfig.test.json
```

### 3. Copy Source Files

```
src/
├── setupTests.ts
└── test-utils.tsx

__mocks__/
└── @supabase/supabase-js.ts

__tests__/
├── auth.test.tsx
├── ai-chat.test.tsx
└── api-calls.test.ts
```

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only changed tests
npm run test:changed

# Update snapshots
npm run test:update-snapshots

# Clear Jest cache
npm run test:clear-cache
```

### Coverage Reports

After running `npm run test:coverage`, reports are generated in:

- `coverage/lcov-report/index.html` - HTML report (open in browser)
- `coverage/coverage-summary.json` - JSON summary
- `coverage/coverage-final.json` - Final coverage data

## 📝 Writing Tests

### Example Test Structure

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { mockSupabase } from '../../__mocks__/@supabase/supabase-js';

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Act
    render(<MyComponent />);
    const button = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(button);

    // Assert
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
  });
});
```

### Using Test Utilities

```tsx
import {
  render,
  screen,
  createMockUser,
  createMockConversation,
  changeInput,
  clickButton,
  wait,
} from '../test-utils';

// Create mock data
const user = createMockUser({ is_admin: true });
const conversation = createMockConversation({ messages: [] });

// Use helper functions
changeInput(emailInput, 'test@example.com');
clickButton(submitButton);
await wait(1000);
```

## 🔧 Mocking

### Supabase Client

The Supabase client is automatically mocked. Use it in your tests:

```tsx
mockSupabase.auth.signInWithPassword.mockResolvedValue({
  data: { user: mockUser },
  error: null,
});

mockSupabase.from('profiles').select().mockResolvedValue({
  data: [mockUser],
  error: null,
});
```

### Custom Mocks

Create mocks in `__mocks__/` folder:

```ts
// __mocks__/myModule.ts
export const myFunction = jest.fn();
```

### Module Mocks

```tsx
jest.mock('../../error-handling-system', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));
```

## ✅ Test Coverage Goals

Current thresholds in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

Adjust based on your project needs.

## 📊 Test Files Organization

```
__tests__/
├── auth.test.tsx          # Authentication flow tests
├── ai-chat.test.tsx       # AI chat feature tests
├── api-calls.test.ts      # API and data fetching tests
└── components/            # Component-specific tests
    ├── Button.test.tsx
    └── Form.test.tsx
```

## 🎯 Best Practices

### 1. Test User Behavior, Not Implementation

```tsx
// ❌ Bad
expect(component.state.isOpen).toBe(true);

// ✅ Good
expect(screen.getByText(/open/i)).toBeInTheDocument();
```

### 2. Use User Event for Interactions

```tsx
import { userEvent } from '@testing-library/user-event';

await userEvent.type(input, 'text');
await userEvent.click(button);
```

### 3. Clean Up Mocks

```tsx
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 4. Async Testing

```tsx
it('should load data', async () => {
  render(<Component />);
  
  const item = await screen.findByText(/loaded item/i);
  expect(item).toBeInTheDocument();
});
```

### 5. Test Error States

```tsx
it('should handle errors', async () => {
  mockApi.mockRejectedValue(new Error('Failed'));
  
  render(<Component />);
  
  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

## 🔍 Debugging Tests

### Run Specific Test

```bash
# By filename
jest auth.test.tsx

# By test name
jest -t "should sign in successfully"

# With debug output
jest --verbose
```

### Console Logging

```tsx
console.log(screen.debug()); // Print DOM
screen.debug(element); // Print specific element
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

## 🐛 Common Issues

### Issue: "Cannot find module"

**Solution:** Check `moduleNameMapper` in `jest.config.js`

### Issue: "SyntaxError: Unexpected token"

**Solution:** Ensure Babel presets are configured correctly

### Issue: "window is not defined"

**Solution:** Make sure `testEnvironment: 'jsdom'` is set

### Issue: Mock not working

**Solution:** Call `jest.clearAllMocks()` in `beforeEach`

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## 📄 License

MIT
