# AI Chat System - Usage Guide

## Overview

Production-ready AI chat system with Google Gemini integration, error handling, and React hooks.

## Files Created

1. **`src/services/aiService.ts`** - Core AI service with Gemini API integration
2. **`src/services/aiService.test.ts`** - Comprehensive test suite
3. **`src/hooks/useAIChat.ts`** - React hook for chat functionality

## Quick Start

### 1. Basic Usage with Hook

```tsx
import { useAIChat } from './hooks/useAIChat';

function ChatComponent() {
  const { messages, loading, error, sendMessage, clearHistory } = useAIChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = e.target as HTMLFormElement;
    const message = input.message.value;
    
    await sendMessage(message);
    input.reset();
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      
      {loading && <p>AI is thinking...</p>}
      {error && <p className="error">{error.message}</p>}
      
      <form onSubmit={handleSubmit}>
        <input name="message" placeholder="Type your message..." />
        <button type="submit" disabled={loading}>
          Send
        </button>
        <button type="button" onClick={clearHistory}>
          Clear Chat
        </button>
      </form>
    </div>
  );
}
```

### 2. Direct Service Usage

```tsx
import { sendMessageToAI, getConversationHistory, clearConversationHistory } from './services/aiService';

// Send a message
const response = await sendMessageToAI('Hello!');
console.log(response.message); // AI's response
console.log(response.timestamp); // When it was sent
console.log(response.model); // 'gemini-pro'

// Get conversation history
const history = getConversationHistory();

// Clear history
clearConversationHistory();
```

### 3. Configure API Key

Add to your `.env` file:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

## Features

### ✅ Automatic Error Handling
- Network errors
- API timeouts (30s default)
- Invalid responses
- Fallback to mock responses when API key is missing

### ✅ Conversation Memory
- Automatically stores last 20 messages
- Maintains context across conversations
- Prevents memory leaks

### ✅ Type Safety
- Full TypeScript support
- Request/Response typing
- Error type discrimination

### ✅ Testing Ready
- 15+ test cases covering:
  - Success responses
  - Empty messages
  - Error scenarios
  - Network failures
  - Timeout handling
  - Concurrent requests
  - Conversation history

## API Reference

### aiService.ts

#### Types
```typescript
interface AIRequest {
  message: string;
  conversationHistory?: ConversationMessage[];
}

interface AIResponse {
  message: string;
  timestamp: string;
  model?: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

#### Functions
- `sendMessageToAI(message: string): Promise<AIResponse>`
- `getConversationHistory(): ConversationMessage[]`
- `clearConversationHistory(): void`

### useAIChat.ts

#### Return Value
```typescript
{
  messages: ConversationMessage[];
  loading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<AIResponse | null>;
  clearHistory: () => void;
}
```

## Error Handling

The service provides detailed error types:

```typescript
try {
  await sendMessageToAI('Hello');
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Handle network issue
  } else if (error.code === 'TIMEOUT') {
    // Handle timeout
  } else if (error.code === 'API_ERROR') {
    // Handle API error
  }
}
```

## Mock Mode

If no API key is provided, the service automatically uses intelligent mock responses:

- Responds to greetings
- Handles help requests
- Provides contextual fallback messages
- Perfect for development/testing

## Best Practices

1. **Always use the hook** for React components (manages state automatically)
2. **Use direct service** for non-React code or custom state management
3. **Clear history** when users start new conversations
4. **Handle errors** gracefully in UI
5. **Show loading states** for better UX

## Testing

Run tests (in testing-setup directory):

```bash
cd testing-setup
npm test -- aiService.test.ts
```

Test coverage includes:
- ✅ Success responses
- ✅ Empty message validation
- ✅ Error type discrimination
- ✅ Network error handling
- ✅ Timeout scenarios
- ✅ Conversation history management
- ✅ Singleton pattern verification
- ✅ Concurrent request handling

## Future Enhancements

Ready for:
- Streaming responses
- Multiple AI models
- Custom temperature settings
- System prompts
- Image analysis (Gemini Vision)
- Function calling
- Rate limiting

## Architecture Notes

- **Singleton Pattern**: Single instance maintains conversation state
- **Promise-based**: All operations are async
- **Immutable History**: Returns copies, not references
- **Memory Safe**: Auto-limits history to 20 messages
- **Timeout Protected**: 30s timeout prevents hanging requests
