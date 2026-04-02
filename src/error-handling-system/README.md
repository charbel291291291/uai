# Global Error Handling System

A comprehensive error handling solution for React applications with toast notifications, API error handling, and error boundaries.

## Features

- **React Error Boundary**: Catches and handles JavaScript errors in component trees
- **Toast Notification System**: Success, error, warning, and info toasts with auto-dismiss
- **Central API Error Handler**: Unified error handling for all API calls
- **Retry Mechanism**: Automatic retry support for failed requests
- **Custom Hooks**: `useApi` and `useFetch` for easy integration

## Installation

Copy all files from this folder to your React project:

```
error-handling-system/
├── ErrorBoundary.tsx
├── ToastContext.tsx
├── ToastContainer.tsx
├── ApiErrorHandler.ts
├── useApi.ts
├── index.ts
└── README.md
```

## Quick Start

### 1. Wrap Your App

```tsx
import { ToastProvider, ToastContainer, ErrorBoundary } from './error-handling-system';

function App() {
  return (
    <ToastProvider defaultDuration={5000} maxToasts={5}>
      <ErrorBoundary>
        {/* Your app components */}
        <YourComponents />
      </ErrorBoundary>
      
      {/* Toast container - renders notifications */}
      <ToastContainer />
    </ToastProvider>
  );
}
```

### 2. Use Toast Notifications

```tsx
import { useToast } from './error-handling-system';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success({
      title: 'Success!',
      message: 'Operation completed successfully.',
      duration: 5000,
    });
  };

  const handleError = () => {
    toast.error({
      title: 'Error',
      message: 'Something went wrong.',
      retry: async () => {
        // Retry logic here
      },
    });
  };

  return (
    <>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
    </>
  );
}
```

### 3. Handle API Errors

```tsx
import { useApi } from './error-handling-system';

function UserProfile() {
  const fetchUser = async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw { response };
    return response.json();
  };

  const { data, loading, error, execute, retry } = useApi(fetchUser, {
    showToast: true,
    showLoading: true,
    successMessage: 'User loaded!',
    errorMessage: 'Failed to load user',
    retryable: true,
  });

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>{error.message}</p>}
      {data && <p>{data.name}</p>}
      <button onClick={() => execute('123')}>Load User</button>
      {error?.retryable && <button onClick={retry}>Retry</button>}
    </div>
  );
}
```

## API Reference

### ToastProvider

```tsx
<ToastProvider
  defaultDuration={5000}  // Auto-dismiss time in ms (0 = persistent)
  maxToasts={5}          // Maximum visible toasts
>
```

### useToast Hook

```tsx
const toast = useToast();

// Show toasts
toast.success({ title: 'Success', message?: string, duration?: number, retry?: () => Promise<void> });
toast.error({ title: 'Error', message?: string, duration?: number, retry?: () => Promise<void> });
toast.warning({ title: 'Warning', message?: string, duration?: number });
toast.info({ title: 'Info', message?: string, duration?: number });

// Manage toasts
toast.dismissAll(); // Dismiss all toasts
```

### ErrorBoundary

```tsx
<ErrorBoundary
  fallback={<CustomFallback />}  // Custom error UI
  onError={(error, errorInfo) => {}}  // Error callback
>
  <YourComponent />
</ErrorBoundary>
```

### useApi Hook

```tsx
const { data, loading, error, execute, reset, retry } = useApi(apiFunction, {
  showToast?: boolean,      // Show error toast (default: true)
  showLoading?: boolean,    // Show loading state (default: true)
  successMessage?: string,  // Show success toast message
  errorMessage?: string,    // Override error message
  retryable?: boolean,      // Enable retry (default: false)
  onError?: (error) => void,   // Error callback
  onSuccess?: (data) => void,  // Success callback
});
```

### ApiErrorHandler Class

```tsx
import { ApiErrorHandler } from './error-handling-system';

const handler = new ApiErrorHandler({
  showToast: true,
  logError: true,
  customMessages: {
    404: 'Resource not found',
    500: 'Server error',
  },
  retryableStatuses: [408, 429, 500, 502, 503, 504],
});

handler.handleError(error);
```

## Toast Types

| Type | Use Case | Color |
|------|----------|-------|
| `success` | Operation completed successfully | Green (#10B981) |
| `error` | Operation failed | Red (#EF4444) |
| `warning` | Caution or deprecation | Orange (#F59E0B) |
| `info` | General information | Blue (#3B82F6) |

## Retry Mechanism

Failed API calls can be retried if they're retryable:

```tsx
const { retry } = useApi(apiFunction, { retryable: true });

// Or with manual toast
toast.error({
  title: 'Failed',
  retry: async () => {
    await apiFunction();
  },
});
```

## Error Boundary Fallback

Default error UI is provided, but you can customize it:

```tsx
<ErrorBoundary
  fallback={
    <div>
      <h2>Something went wrong</h2>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  }
>
```

## Best Practices

1. **Wrap your entire app** with `ToastProvider` and `ErrorBoundary` at the root level
2. **Place `ToastContainer`** at the root of your app (outside routing)
3. **Use `showToast: true`** for automatic error feedback
4. **Provide retry callbacks** for important operations
5. **Log errors** in development for debugging
6. **Integrate with error tracking** services (Sentry, LogRocket) in production

## Customization

### Styling

Edit the inline styles in `ToastContainer.tsx` or move them to a CSS file:

```css
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
}

.toast {
  /* Your custom styles */
}
```

### Duration

Set global default duration in `ToastProvider`:

```tsx
<ToastProvider defaultDuration={10000}> {/* 10 seconds */}
```

Or override per toast:

```tsx
toast.error({ title: 'Error', duration: 0 }); // Persistent
```

## License

MIT
