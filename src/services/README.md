# UAi Service Layer

Centralized API service layer for the UAi application. This layer separates all Supabase/database logic from the UI components.

## Architecture

```
services/
├── apiClient.ts      # Base API client with error handling
├── authService.ts    # Authentication operations
├── profileService.ts # Profile CRUD operations
├── orderService.ts   # Orders & payments
├── aiService.ts      # AI chat functionality
└── index.ts          # Centralized exports
```

## Services

### Auth Service

Handles all authentication operations:

```typescript
import { authService, signInWithOAuth, signOut } from '../services';

// Sign in with OAuth
const { url, error } = await signInWithOAuth({ 
  provider: 'google',
  redirectTo: '/dashboard'
});

// Sign out
const { success, error } = await signOut();

// Get current session
const { user, error } = await authService.getSession();
```

### Profile Service

Manages user profiles:

```typescript
import { profileService, updateProfile, searchProfiles } from '../services';

// Get profile
const { data, error } = await profileService.getProfileById(userId);

// Update profile
const { data, error } = await updateProfile(userId, {
  displayName: 'New Name',
  bio: 'New bio',
});

// Search profiles
const { data, error } = await searchProfiles('john');
```

### Order Service

Handles NFC orders and payments:

```typescript
import { orderService, createOrder, createPaymentRequest } from '../services';

// Create NFC order
const { data, error } = await createOrder({
  userId,
  productType: 'card',
  quantity: 2,
  shippingAddress: { ... },
  totalAmount: 30,
});

// Create payment request
const { data, error } = await createPaymentRequest({
  userId,
  plan: 'pro',
  paymentMethod: 'bank_transfer',
  proofFile: file,
});
```

### AI Service

Manages AI chat:

```typescript
import { aiService, sendMessageToAI } from '../services';

// Send message
const response = await sendMessageToAI('Hello!');
console.log(response.message);
```

## Response Format

All services return a standardized response:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}

interface ApiError {
  message: string;
  code: string;
  details?: any;
}
```

### Usage Example

```typescript
const { data, error, success } = await profileService.getProfileById(userId);

if (success && data) {
  // Use data
  console.log(data.displayName);
} else if (error) {
  // Handle error
  console.error(error.message);
}
```

## Hooks

Services are consumed through React hooks in `src/hooks/`:

### useAuth

```typescript
import { useAuth } from '../hooks';

function MyComponent() {
  const { user, signInWithOAuth, signOut } = useAuth();
  
  return (
    <button onClick={() => signInWithOAuth('google')}>
      Sign In
    </button>
  );
}
```

### useProfile

```typescript
import { useProfile } from '../hooks';

function MyComponent() {
  const { profile, loading, updateProfile } = useProfile(userId);
  
  if (loading) return <Spinner />;
  
  return <div>{profile?.displayName}</div>;
}
```

### useSubscription

```typescript
import { useSubscription } from '../hooks';

function MyComponent() {
  const { subscription, hasFeature, isExpired } = useSubscription(userId);
  
  const canUseAI = hasFeature('ai-mode');
  
  return <div>{canUseAI ? 'AI Enabled' : 'Upgrade Required'}</div>;
}
```

## Error Handling

Services handle errors consistently:

```typescript
try {
  const { data, error } = await someService.operation();
  
  if (error) {
    // Service-level error
    throw new Error(error.message);
  }
  
  return data;
} catch (err) {
  // Unexpected error
  console.error('Operation failed:', err);
}
```

## Adding New Services

1. Create new service file in `src/services/`
2. Use `apiClient` for Supabase operations
3. Return standardized `ApiResponse<T>`
4. Export from `src/services/index.ts`
5. Create corresponding hook in `src/hooks/`
6. Export from `src/hooks/index.ts`

### Service Template

```typescript
import { apiClient } from './apiClient';

class MyService {
  private supabase = apiClient.supabase;

  async myOperation(data: MyData) {
    try {
      const { data: result, error } = await this.supabase
        .from('my_table')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return apiClient.createResponse<MyResult>(result, null);
    } catch (error: any) {
      return apiClient.createResponse<MyResult>(null, error);
    }
  }
}

const myService = new MyService();
export default myService;
export const { myOperation } = myService;
```

## Benefits

1. **Separation of Concerns**: UI components don't know about Supabase
2. **Testability**: Services can be mocked for testing
3. **Reusability**: Same service used across multiple components
4. **Maintainability**: Database changes only affect services
5. **Type Safety**: Full TypeScript support throughout
6. **Consistent Error Handling**: Standardized error responses
