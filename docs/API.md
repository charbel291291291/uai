# UAi API Documentation

Comprehensive API reference for the UAi platform service layer.

## Table of Contents

- [Overview](#overview)
- [API Client](#api-client)
- [Authentication Service](#authentication-service)
- [Profile Service](#profile-service)
- [AI Service](#ai-service)
- [Order Service](#order-service)
- [Analytics Service](#analytics-service)
- [Contact Message Service](#contact-message-service)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

---

## Overview

The UAi API is built on a service layer architecture that provides a clean separation between UI components and data operations. All services follow a consistent pattern:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}
```

### Installation

Services are imported from the centralized export:

```typescript
import { 
  authService, 
  profileService, 
  aiService,
  orderService,
  analyticsService 
} from '@/services';
```

### Usage Pattern

```typescript
const { data, error, success } = await someService.operation(params);

if (success && data) {
  // Handle successful response
} else if (error) {
  // Handle error
  console.error(error.message);
}
```

---

## API Client

Base client providing shared functionality across all services.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `supabase` | `SupabaseClient` | Supabase client instance |

### Methods

#### `handleError(error: any): ApiError`

Converts errors to standardized format.

**Parameters:**
- `error` - Error object or exception

**Returns:** Standardized `ApiError` object

**Example:**
```typescript
try {
  const result = await someOperation();
} catch (error) {
  const apiError = apiClient.handleError(error);
  console.error(apiError.message);
}
```

#### `createResponse<T>(data: T | null, error: any): ApiResponse<T>`

Wraps operation results in standard response format.

**Parameters:**
- `data` - Result data (or null)
- `error` - Error object (or null)

**Returns:** `ApiResponse<T>` object

---

## Authentication Service

Handles all authentication operations including OAuth, session management, and password operations.

**Import:**
```typescript
import { authService, signInWithOAuth, signOut } from '@/services';
```

### Methods

#### `signUp(data: SignUpData): Promise<AuthResponse>`

Register a new user account.

**Parameters:**
- `data` - Registration data
  - `email` (string) - User email
  - `password` (string) - User password
  - `displayName` (string) - Display name

**Returns:** `AuthResponse` with user data or error

**Example:**
```typescript
const { data, error } = await authService.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  displayName: 'John Doe'
});

if (data?.user) {
  console.log('User created:', data.user.email);
}
```

#### `signIn(data: SignInData): Promise<AuthResponse>`

Sign in with email/password.

**Parameters:**
- `data` - Credentials
  - `email` (string) - User email
  - `password` (string) - User password

**Example:**
```typescript
const { data, error } = await authService.signIn({
  email: 'user@example.com',
  password: 'securePassword123'
});
```

#### `signInWithOAuth(options: OAuthOptions): Promise<{ url?: string; error?: ApiError }>`

Initiate OAuth sign-in flow.

**Parameters:**
- `options` - OAuth configuration
  - `provider` ('google' | 'github' | 'microsoft') - OAuth provider
  - `redirectTo` (string) - Redirect URL after auth

**Returns:** OAuth URL or error

**Example:**
```typescript
const { url, error } = await signInWithOAuth({
  provider: 'google',
  redirectTo: '/dashboard'
});

if (url) {
  window.location.href = url;
}
```

#### `signOut(): Promise<{ success: boolean; error?: ApiError }>`

Sign out current user.

**Returns:** Success status

**Example:**
```typescript
const { success, error } = await signOut();
if (success) {
  console.log('Signed out successfully');
}
```

#### `getSession(): Promise<{ user: User | null; error?: ApiError }>`

Get current user session.

**Returns:** Current user or null

**Example:**
```typescript
const { user, error } = await authService.getSession();
if (user) {
  console.log('Logged in as:', user.email);
}
```

#### `getCurrentUser(): Promise<User | null>`

Get current user metadata.

**Example:**
```typescript
const user = await authService.getCurrentUser();
console.log(user?.user_metadata);
```

#### `resetPassword(email: string): Promise<{ success: boolean; error?: ApiError }>`

Send password reset email.

**Parameters:**
- `email` - User email

**Example:**
```typescript
const { success } = await authService.resetPassword('user@example.com');
```

#### `updatePassword(newPassword: string): Promise<{ success: boolean; error?: ApiError }>`

Update current user password.

**Parameters:**
- `newPassword` - New password

**Example:**
```typescript
const { success } = await authService.updatePassword('newSecurePassword123');
```

#### `onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): Subscription`

Subscribe to authentication state changes.

**Example:**
```typescript
const subscription = onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  if (session) {
    console.log('Session updated');
  }
});

// Cleanup
subscription.unsubscribe();
```

---

## Profile Service

Manages user profiles including CRUD operations, search, and profile enhancements.

**Import:**
```typescript
import { profileService, updateProfile, searchProfiles } from '@/services';
```

### Methods

#### `createProfile(data: CreateProfileData): Promise<ApiResponse<UserProfile>>`

Create a new user profile.

**Parameters:**
- `data` - Profile data
  - `userId` (string) - User ID
  - `username` (string) - Unique username
  - `displayName` (string) - Display name
  - `bio` (string, optional) - Bio text
  - `avatarUrl` (string, optional) - Avatar URL

**Example:**
```typescript
const { data, error } = await profileService.createProfile({
  userId: 'user-123',
  username: 'johndoe',
  displayName: 'John Doe',
  bio: 'Digital creator'
});
```

#### `getProfileById(userId: string): Promise<ApiResponse<UserProfile>>`

Get profile by user ID.

**Parameters:**
- `userId` - User ID

**Example:**
```typescript
const { data, error } = await profileService.getProfileById('user-123');
if (data) {
  console.log('Profile:', data.displayName);
}
```

#### `getProfileByUsername(username: string): Promise<ApiResponse<UserProfile>>`

Get profile by username.

**Example:**
```typescript
const { data } = await profileService.getProfileByUsername('johndoe');
```

#### `updateProfile(userId: string, updates: UpdateProfileData): Promise<ApiResponse<UserProfile>>`

Update user profile.

**Parameters:**
- `userId` - User ID
- `updates` - Fields to update
  - `displayName` (optional)
  - `bio` (optional)
  - `avatarUrl` (optional)
  - `links` (optional)
  - `services` (optional)

**Example:**
```typescript
const { data } = await updateProfile('user-123', {
  displayName: 'John D.',
  bio: 'Updated bio'
});
```

#### `deleteProfile(userId: string): Promise<ApiResponse<void>>`

Delete user profile.

**Example:**
```typescript
await profileService.deleteProfile('user-123');
```

#### `getAllProfiles(): Promise<ApiResponse<UserProfile[]>>`

Get all profiles.

**Example:**
```typescript
const { data } = await profileService.getAllProfiles();
```

#### `searchProfiles(query: string, filters?: ProfileFilters): Promise<ApiResponse<UserProfile[]>>`

Search profiles by query.

**Parameters:**
- `query` - Search query
- `filters` - Optional filters
  - `limit` (number) - Max results
  - `offset` (number) - Pagination offset

**Example:**
```typescript
const { data } = await searchProfiles('john', { limit: 10 });
```

#### `checkUsernameAvailability(username: string): Promise<{ available: boolean }>`

Check if username is available.

**Example:**
```typescript
const { available } = await profileService.checkUsernameAvailability('johndoe');
```

#### `addService(userId: string, service: ServiceData): Promise<ApiResponse<UserProfile>>`

Add a service to profile.

**Example:**
```typescript
await profileService.addService(userId, {
  name: 'Web Development',
  description: 'Full-stack web dev'
});
```

#### `removeService(userId: string, serviceId: string): Promise<ApiResponse<UserProfile>>`

Remove a service from profile.

#### `addLink(userId: string, link: LinkData): Promise<ApiResponse<UserProfile>>`

Add a social link to profile.

**Example:**
```typescript
await profileService.addLink(userId, {
  type: 'twitter',
  url: 'https://twitter.com/johndoe'
});
```

#### `removeLink(userId: string, linkId: string): Promise<ApiResponse<UserProfile>>`

Remove a link from profile.

#### `addTestimonial(userId: string, testimonial: TestimonialData): Promise<ApiResponse<UserProfile>>`

Add a testimonial to profile.

#### `uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }>`

Upload profile avatar.

**Example:**
```typescript
const fileInput = document.querySelector('input[type="file"]');
const { avatarUrl } = await profileService.uploadAvatar(userId, fileInput.files[0]);
```

#### `getProfileStats(userId: string): Promise<ProfileStats>`

Get profile statistics.

**Returns:** Stats including views, clicks, etc.

---

## AI Service

Manages AI-powered chat conversations using Google Gemini AI.

**Import:**
```typescript
import { aiService, sendMessageToAI } from '@/services';
```

### Methods

#### `sendMessageToAI(message: string, options?: AIRequest): Promise<AIResponse>`

Send a message and get AI response.

**Parameters:**
- `message` - User message
- `options` - Optional configuration
  - `conversationId` (string) - Conversation context
  - `temperature` (number) - Response creativity (0-1)
  - `maxTokens` (number) - Max response length

**Returns:** AI response with message

**Example:**
```typescript
const { data, error } = await sendMessageToAI('Hello!', {
  temperature: 0.7,
  maxTokens: 500
});

if (data) {
  console.log('AI:', data.message);
}
```

#### `getConversationHistory(conversationId?: string): Promise<ConversationMessage[]>`

Get conversation history.

**Parameters:**
- `conversationId` - Optional conversation ID

**Example:**
```typescript
const history = await aiService.getConversationHistory();
console.log('Messages:', history.length);
```

#### `clearConversationHistory(conversationId?: string): Promise<void>`

Clear conversation history.

**Example:**
```typescript
await aiService.clearConversationHistory();
```

#### `streamMessage(message: string, onChunk: (chunk: string) => void): Promise<string>`

Stream AI response in real-time.

**Parameters:**
- `message` - User message
- `onChunk` - Callback for each chunk

**Example:**
```typescript
const fullResponse = await aiService.streamMessage(
  'Tell me a story',
  (chunk) => {
    console.log('Received chunk:', chunk);
  }
);
```

---

## Order Service

Handles NFC orders, payment requests, and order management.

**Import:**
```typescript
import { orderService, createOrder, createPaymentRequest } from '@/services';
```

### Methods

#### `createOrder(data: CreateOrderData): Promise<ApiResponse<Order>>`

Create a new NFC order.

**Parameters:**
- `data` - Order details
  - `userId` (string) - User ID
  - `productType` ('card' | 'sticker' | 'wristband') - Product type
  - `quantity` (number) - Quantity
  - `shippingAddress` (ShippingAddress) - Shipping info
  - `totalAmount` (number) - Total price

**Example:**
```typescript
const { data, error } = await createOrder({
  userId: 'user-123',
  productType: 'card',
  quantity: 2,
  shippingAddress: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'USA'
  },
  totalAmount: 30
});
```

#### `getUserOrders(userId: string): Promise<ApiResponse<Order[]>>`

Get orders for a user.

**Example:**
```typescript
const { data } = await orderService.getUserOrders(userId);
```

#### `getOrderById(orderId: string): Promise<ApiResponse<Order>>`

Get specific order.

#### `getAllOrders(filters?: OrderFilters): Promise<ApiResponse<Order[]>>`

Get all orders with optional filters.

#### `updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<Order>>`

Update order status.

**Example:**
```typescript
await orderService.updateOrderStatus(orderId, 'shipped');
```

#### `cancelOrder(orderId: string): Promise<ApiResponse<Order>>`

Cancel an order.

#### `createPaymentRequest(data: CreatePaymentData): Promise<ApiResponse<PaymentRequest>>`

Create a payment request.

**Parameters:**
- `data` - Payment details
  - `userId` (string) - User ID
  - `plan` ('starter' | 'pro' | 'enterprise') - Subscription plan
  - `paymentMethod` ('bank_transfer' | 'card' | 'crypto') - Payment method
  - `proofFile` (File, optional) - Payment proof

**Example:**
```typescript
const { data } = await createPaymentRequest({
  userId: 'user-123',
  plan: 'pro',
  paymentMethod: 'bank_transfer'
});
```

#### `getUserPaymentHistory(userId: string): Promise<ApiResponse<PaymentRequest[]>>`

Get user's payment history.

#### `getPendingPayments(): Promise<ApiResponse<PaymentRequest[]>>`

Get pending payments (admin).

#### `approvePayment(paymentId: string, data: PaymentApprovalData): Promise<ApiResponse<PaymentRequest>>`

Approve a payment request.

#### `rejectPayment(paymentId: string, reason: string): Promise<ApiResponse<PaymentRequest>>`

Reject a payment request.

#### `getPaymentStats(): Promise<PaymentStats>`

Get payment statistics.

---

## Analytics Service

Tracks and retrieves analytics data for user engagement and profile performance.

**Import:**
```typescript
import { analyticsService, trackEvent, trackPageView } from '@/services';
```

### Methods

#### `trackEvent(data: TrackEventData): Promise<void>`

Track a custom event.

**Parameters:**
- `data` - Event data
  - `eventType` (string) - Event type
  - `userId` (string, optional) - User ID
  - `properties` (object, optional) - Additional properties

**Example:**
```typescript
await trackEvent({
  eventType: 'button_click',
  userId: 'user-123',
  properties: {
    buttonName: 'signup',
    page: '/home'
  }
});
```

#### `trackPageView(page: string, userId?: string): Promise<void>`

Track a page view.

**Example:**
```typescript
await analyticsService.trackPageView('/dashboard', userId);
```

#### `trackProfileView(profileId: string, viewerId?: string): Promise<void>`

Track a profile view.

#### `trackChatStarted(userId: string): Promise<void>`

Track chat session start.

#### `trackCTAClick(ctaType: string, userId?: string): Promise<void>`

Track CTA button click.

#### `trackNFCTap(nfcId: string, userId?: string): Promise<void>`

Track NFC tap event.

#### `getEvents(filters?: AnalyticsFilters): Promise<AnalyticsEvent[]>`

Get events with filters.

**Example:**
```typescript
const events = await analyticsService.getEvents({
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  eventType: 'page_view'
});
```

#### `getProfileAnalytics(profileId: string): Promise<ProfileAnalytics>`

Get detailed profile analytics.

#### `getDailySummary(date: Date): Promise<DailyAnalyticsSummary>`

Get daily analytics summary.

#### `aggregateDailyAnalytics(): Promise<void>`

Aggregate analytics for reporting.

#### `getAnalyticsSummary(filters?: AnalyticsFilters): Promise<AnalyticsSummary>`

Get comprehensive analytics summary.

---

## Contact Message Service

Manages contact form messages and support tickets.

**Import:**
```typescript
import { contactMessageService, createMessage } from '@/services';
```

### Methods

#### `createMessage(data: CreateContactMessageData): Promise<ApiResponse<ContactMessage>>`

Create a new contact message.

**Parameters:**
- `data` - Message data
  - `senderEmail` (string) - Sender email
  - `subject` (string) - Message subject
  - `content` (string) - Message content
  - `recipientId` (string, optional) - Recipient user ID

**Example:**
```typescript
const { data } = await createMessage({
  senderEmail: 'user@example.com',
  subject: 'Question about pricing',
  content: 'I have a question...'
});
```

#### `getMessageById(messageId: string): Promise<ApiResponse<ContactMessage>>`

Get message by ID.

#### `getAllMessages(filters?: ContactMessageFilters): Promise<ApiResponse<ContactMessage[]>>`

Get all messages with filters.

#### `getUserMessages(userId: string): Promise<ApiResponse<ContactMessage[]>>`

Get messages for a user.

#### `updateMessage(messageId: string, updates: UpdateContactMessageData): Promise<ApiResponse<ContactMessage>>`

Update message.

#### `deleteMessage(messageId: string): Promise<ApiResponse<void>>`

Delete message.

#### `assignMessage(messageId: string, assigneeId: string): Promise<ApiResponse<ContactMessage>>`

Assign message to team member.

#### `markAsResponded(messageId: string): Promise<ApiResponse<ContactMessage>>`

Mark message as responded.

#### `resolveMessage(messageId: string): Promise<ApiResponse<ContactMessage>>`

Mark message as resolved.

#### `markAsSpam(messageId: string): Promise<ApiResponse<ContactMessage>>`

Mark message as spam.

#### `getMessageStats(): Promise<MessageStats>`

Get message statistics.

#### `getUnassignedMessages(): Promise<ApiResponse<ContactMessage[]>>`

Get unassigned messages.

#### `getMessagesByAssignee(assigneeId: string): Promise<ApiResponse<ContactMessage[]>>`

Get messages assigned to specific user.

---

## Error Handling

All services use consistent error handling:

### Error Types

```typescript
interface ApiError {
  message: string;
  code: string;
  details?: any;
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Invalid credentials |
| `FORBIDDEN` | Insufficient permissions |
| `VALIDATION_ERROR` | Invalid input data |
| `NETWORK_ERROR` | Network connectivity issue |
| `SERVER_ERROR` | Internal server error |
| `RATE_LIMITED` | Too many requests |

### Error Handling Pattern

```typescript
try {
  const { data, error, success } = await someService.operation();
  
  if (!success && error) {
    switch (error.code) {
      case 'AUTH_REQUIRED':
        // Redirect to login
        break;
      case 'NOT_FOUND':
        // Show 404 page
        break;
      case 'VALIDATION_ERROR':
        // Show validation errors
        console.error(error.details);
        break;
      default:
        // Show generic error
        console.error(error.message);
    }
  }
  
  if (data) {
    // Handle success
  }
} catch (err) {
  // Unexpected error
  console.error('Unexpected error:', err);
}
```

---

## Type Definitions

### Core Types

```typescript
interface UserProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  links?: Link[];
  services?: Service[];
  testimonials?: Testimonial[];
  createdAt: string;
  updatedAt: string;
}

interface Link {
  id: string;
  type: string;
  url: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price?: number;
}

interface Testimonial {
  id: string;
  author: string;
  content: string;
  rating: number;
}

interface Order {
  id: string;
  userId: string;
  productType: 'card' | 'sticker' | 'wristband';
  quantity: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  totalAmount: number;
  createdAt: string;
}

interface PaymentRequest {
  id: string;
  userId: string;
  plan: 'starter' | 'pro' | 'enterprise';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: 'bank_transfer' | 'card' | 'crypto';
  createdAt: string;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

interface ContactMessage {
  id: string;
  senderEmail: string;
  subject: string;
  content: string;
  status: 'new' | 'assigned' | 'responded' | 'resolved' | 'spam';
  assigneeId?: string;
  createdAt: string;
}
```

---

<div align="center">
  <sub>Last updated: April 2026</sub>
</div>
