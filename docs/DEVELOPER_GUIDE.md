# UAi Developer Guide

A practical guide for developers working with the UAi codebase.

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Component Development](#component-development)
- [Working with Hooks](#working-with-hooks)
- [Service Layer](#service-layer)
- [State Management](#state-management)
- [Styling Guide](#styling-guide)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Testing](#testing)
- [Debugging](#debugging)

---

## Getting Started

### Development Environment Setup

```bash
# Clone and install
git clone https://github.com/your-org/uai.git
cd uai
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development
npm run dev
```

### IDE Recommendations

**VS Code Extensions:**
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- TypeScript Hero

**Settings.json:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Architecture Overview

### Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── common/     # Shared components (Button, Card, etc.)
│   ├── layout/     # Layout components (Header, Footer, etc.)
│   └── ui/         # Base UI components with design system
├── hooks/          # Custom React hooks
├── pages/          # Page-level components
├── services/       # API service layer
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── styles/         # Global styles
```

### Data Flow

```
User Interaction
    ↓
Component (UI)
    ↓
Hook (Logic)
    ↓
Service (API)
    ↓
Supabase/AI
```

### Key Principles

1. **Separation of Concerns**: UI doesn't know about data sources
2. **Single Responsibility**: Each component/hook/service does one thing well
3. **Composition Over Inheritance**: Build complex features from simple parts
4. **Type Safety**: Full TypeScript coverage throughout

---

## Component Development

### Component Structure

```tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import type { UserProfile } from '@/types';

// Props interface
interface MyComponentProps {
  title: string;
  userId: string;
  onAction?: (data: string) => void;
  className?: string;
}

// Component with forwardRef if needed
export function MyComponent({ 
  title, 
  userId, 
  onAction,
  className = '' 
}: MyComponentProps) {
  // Local state
  const [loading, setLoading] = useState(false);
  
  // Consume hooks
  const { user } = useAuth();
  
  // Effects
  useEffect(() => {
    // Side effects here
  }, [userId]);
  
  // Event handlers
  const handleClick = async () => {
    setLoading(true);
    try {
      await someAsyncOperation();
      onAction?.('success');
    } finally {
      setLoading(false);
    }
  };
  
  // Render
  return (
    <div className={`p-6 ${className}`}>
      <h2 className="text-xl font-bold">{title}</h2>
      <Button 
        onClick={handleClick}
        isLoading={loading}
      >
        Action
      </Button>
    </div>
  );
}
```

### Component Types

#### Presentational Components

Pure UI components without business logic:

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ title, children, footer }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div>{children}</div>
      {footer && <div className="mt-4 pt-4 border-t">{footer}</div>}
    </div>
  );
}
```

#### Container Components

Components with logic and data fetching:

```tsx
export function UserCard({ userId }: { userId: string }) {
  const { profile, loading } = useProfile(userId);
  
  if (loading) return <SkeletonCard />;
  if (!profile) return <EmptyState />;
  
  return (
    <Card title={profile.displayName}>
      <p>{profile.bio}</p>
    </Card>
  );
}
```

### Best Practices

✅ **DO:**
- Use TypeScript for all components
- Define explicit prop types
- Use destructuring for props
- Keep components small (< 200 lines)
- Extract reusable logic to hooks
- Use semantic HTML elements

❌ **DON'T:**
- Use `any` type
- Create deeply nested components
- Mix concerns (UI + data fetching in same component)
- Use inline styles (use Tailwind classes)
- Forget accessibility attributes

---

## Working with Hooks

### Built-in Hooks

#### useAuth

Authentication state and actions:

```tsx
import { useAuth } from '@/hooks';

function LoginForm() {
  const { user, loading, signInWithOAuth, signOut } = useAuth();
  
  if (loading) return <Spinner />;
  if (user) return <WelcomeMessage name={user.email} />;
  
  return (
    <button onClick={() => signInWithOAuth('google')}>
      Sign in with Google
    </button>
  );
}
```

#### useProfile

Profile data and operations:

```tsx
import { useProfile } from '@/hooks';

function ProfilePage({ userId }: { userId: string }) {
  const { 
    profile, 
    loading, 
    error,
    updateProfile 
  } = useProfile(userId);
  
  const handleUpdate = async (data: UpdateProfileData) => {
    const { success } = await updateProfile(data);
    if (success) {
      // Handle success
    }
  };
  
  if (loading) return <ProfileSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <ProfileForm 
      initialData={profile} 
      onSubmit={handleUpdate}
    />
  );
}
```

#### useSubscription

Subscription status and feature flags:

```tsx
import { useSubscription } from '@/hooks';

function AIFeature({ userId }: { userId: string }) {
  const { subscription, hasFeature, isExpired } = useSubscription(userId);
  
  const canUseAI = hasFeature('ai-mode');
  
  if (!canUseAI) {
    return <UpgradePrompt feature="AI Chat" />;
  }
  
  if (isExpired) {
    return <RenewalPrompt />;
  }
  
  return <AIChat />;
}
```

### Creating Custom Hooks

```tsx
import { useState, useEffect } from 'react';

interface UseCustomHookResult {
  data: DataType | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCustomHook(param: string): UseCustomHookResult {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchApi(param);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [param]);
  
  return { data, loading, error, refetch: fetchData };
}
```

### Hook Guidelines

✅ **DO:**
- Name hooks with `use` prefix
- Keep hooks focused on single concern
- Return consistent object structure
- Handle loading and error states
- Document hook parameters and return value

❌ **DON'T:**
- Call hooks conditionally
- Call hooks in loops
- Create hooks larger than 100 lines
- Mix multiple unrelated concerns

---

## Service Layer

### Using Services

Services are imported from centralized export:

```tsx
import { 
  authService, 
  profileService,
  aiService 
} from '@/services';
```

### Service Pattern

```tsx
// ✅ Good: Proper error handling
const handleUpdate = async () => {
  const { data, error, success } = await profileService.updateProfile(userId, updates);
  
  if (success && data) {
    toast.success('Profile updated!');
    setProfile(data);
  } else if (error) {
    toast.error(error.message);
    console.error('Update failed:', error);
  }
};

// ❌ Bad: Ignoring errors
const handleUpdate = async () => {
  const result = await profileService.updateProfile(userId, updates);
  setProfile(result); // Might be null!
};
```

### Common Service Operations

```tsx
// Authentication
const { url } = await signInWithOAuth({ provider: 'google', redirectTo: '/dashboard' });
window.location.href = url;

// Profile
const { data: profile } = await profileService.getProfileById(userId);

// AI Chat
const { data: response } = await sendMessageToAI('Hello!');

// Orders
const { data: order } = await createOrder(orderData);

// Analytics
await trackEvent({ eventType: 'button_click', userId });
```

### Creating New Services

```typescript
// src/services/myService.ts
import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';

interface MyData {
  id: string;
  name: string;
}

class MyService {
  private supabase = apiClient.supabase;
  
  async getData(id: string): Promise<ApiResponse<MyData>> {
    try {
      const { data, error } = await this.supabase
        .from('my_table')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return apiClient.createResponse<MyData>(data, null);
    } catch (error: any) {
      return apiClient.createResponse<MyData>(null, error);
    }
  }
}

const myService = new MyService();
export default myService;
export const { getData } = myService;
```

---

## State Management

### Local State

For component-specific state:

```tsx
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);
const [form, setForm] = useState({ name: '', email: '' });
```

### Derived State

Compute from existing state:

```tsx
const [items, setItems] = useState<Item[]>([]);
const isEmpty = items.length === 0;
const total = items.reduce((sum, item) => sum + item.price, 0);
```

### Server State

Managed by hooks that consume services:

```tsx
const { data: profile, loading, error } = useProfile(userId);
```

### Form State

```tsx
const [formData, setFormData] = useState({
  email: '',
  password: ''
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await submitForm(formData);
};
```

---

## Styling Guide

### Design System

The app uses a glass-morphism design system:

```tsx
// Glass card background
className="bg-[rgba(15,23,42,0.5)] backdrop-blur-xl border border-white/10"

// Primary button
className="bg-gradient-to-r from-[#00C6FF] to-[#3A86FF]"

// Hover effects
className="hover:-translate-y-1 hover:border-white/20 transition-all duration-200"

// Rounded corners
className="rounded-2xl" // Standard
className="rounded-3xl" // Large
className="rounded-full" // Circle
```

### Tailwind CSS

Use utility classes:

```tsx
<div className="flex items-center justify-between p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Action
  </button>
</div>
```

### Responsive Design

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```

### Custom Classes

When Tailwind isn't enough, add to `index.css`:

```css
.glass-card {
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## Best Practices

### Code Organization

1. **Import Order:**
   ```tsx
   import React from 'react';                    // React
   import { useState } from 'react';             // React hooks
   import { Button } from '@/components/ui';     // Internal components
   import { useAuth } from '@/hooks';            // Internal hooks
   import { profileService } from '@/services';  // Services
   import type { UserProfile } from '@/types';   // Types
   ```

2. **File Naming:**
   - Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
   - Hooks: `usePascalCase.ts` (e.g., `useAuth.ts`)
   - Services: `camelCase.ts` (e.g., `authService.ts`)
   - Utils: `camelCase.ts` (e.g., `formatDate.ts`)

3. **Export Style:**
   ```tsx
   // Named exports (preferred)
   export function MyComponent() {}
   
   // Default export (for pages)
   export default function Page() {}
   ```

### Performance

1. **Lazy Loading:**
   ```tsx
   const LazyComponent = lazy(() => import('./LazyComponent'));
   
   <Suspense fallback={<Spinner />}>
     <LazyComponent />
   </Suspense>
   ```

2. **Memoization:**
   ```tsx
   const memoizedValue = useMemo(() => computeExpensive(data), [data]);
   const memoizedCallback = useCallback(() => doSomething(), []);
   ```

3. **Code Splitting:**
   ```tsx
   // Route-based splitting
   const Dashboard = lazy(() => import('@/pages/Dashboard'));
   
   <Route path="/dashboard" element={
     <Suspense><Dashboard /></Suspense>
   } />
   ```

### Accessibility

```tsx
// Semantic HTML
<button onClick={handleClick} aria-label="Close modal">
  <XIcon aria-hidden="true" />
</button>

// Screen reader support
<span className="sr-only">Loading...</span>

// Focus management
<input 
  type="text" 
  aria-label="Search"
  aria-describedby="search-help"
/>
```

### Security

```tsx
// ✅ Sanitize user input
const sanitized = DOMPurify.sanitize(userInput);

// ✅ Validate on client and server
if (!isValidEmail(email)) {
  throw new ValidationError('Invalid email');
}

// ✅ Use environment variables for secrets
const apiKey = import.meta.env.VITE_API_KEY;

// ❌ Never hardcode secrets
const apiKey = 'sk-1234567890'; // BAD!
```

---

## Common Patterns

### Loading States

```tsx
function Component({ userId }: { userId: string }) {
  const { data, loading } = useData(userId);
  
  if (loading) return <SkeletonLoader />;
  if (!data) return <EmptyState />;
  
  return <Content data={data} />;
}
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <MainContent />
    </ErrorBoundary>
  );
}
```

### Conditional Rendering

```tsx
// Ternary for simple conditions
{isLoggedIn ? <Dashboard /> : <Login />}

// Logical AND for show/hide
{hasPermission && <AdminPanel />}

// Early return for complex logic
if (!user) return null;
if (loading) return <Spinner />;
```

### Form Handling

```tsx
function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const validate = () => {
    const newErrors = {};
    if (!values.name) newErrors.name = 'Name required';
    if (!values.email.includes('@')) newErrors.email = 'Invalid email';
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      await submitForm(values);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

## Testing

### Unit Tests

```tsx
// __tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Integration Tests

```tsx
// __tests__/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components';
import { authService } from '@/services';

jest.mock('@/services');

describe('LoginForm', () => {
  it('handles successful login', async () => {
    (authService.signIn as jest.Mock).mockResolvedValue({
      data: { user: { email: 'test@example.com' } },
      success: true
    });
    
    render(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.click(screen.getByText('Sign In'));
    
    await waitFor(() => {
      expect(authService.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: expect.anything()
      });
    });
  });
});
```

---

## Debugging

### Browser DevTools

```tsx
// Debug state changes
useEffect(() => {
  console.log('State changed:', state);
}, [state]);

// Debug renders
console.log('Component rendered:', { props, state });
```

### React DevTools

Install React DevTools extension to:
- Inspect component tree
- View props and state
- Track re-renders
- Debug hooks

### Error Tracking

```tsx
// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, error });
  // Send to error tracking service
};

// Unhandled promise rejections
window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection:', event.reason);
};
```

### Network Debugging

```tsx
// Log API calls
const debugService = (serviceName: string) => {
  return new Proxy(service, {
    get(target, prop) {
      return (...args: any[]) => {
        console.log(`[${serviceName}] ${String(prop)} called:`, args);
        return target[prop as keyof typeof target](...args);
      };
    }
  });
};
```

---

<div align="center">
  <sub>Last updated: April 2026</sub>
</div>
