import { GoogleGenAI } from '@google/genai';

// ============================================================================
// TYPES
// ============================================================================

export interface AIRequest {
  message: string;
  conversationHistory?: ConversationMessage[];
}

export interface AIResponse {
  message: string;
  timestamp: string;
  model?: string;
  success?: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIError {
  message: string;
  code: 'API_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN' | 'SERVER_ERROR';
  originalError?: Error;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// API endpoint - calls our secure edge function
const AI_API_ENDPOINT = '/api/ai/generate';
const TIMEOUT_MS = 30000;

// ============================================================================
// ERROR HANDLING
// ============================================================================

class AIServiceError implements AIError {
  constructor(
    public message: string,
    public code: AIError['code'],
    public originalError?: Error
  ) {}

  static apiError(error: Error): AIServiceError {
    return new AIServiceError('Failed to get AI response', 'API_ERROR', error);
  }

  static networkError(): AIServiceError {
    return new AIServiceError('Network error. Please check your connection.', 'NETWORK_ERROR');
  }

  static timeoutError(): AIServiceError {
    return new AIServiceError('Request timed out. Please try again.', 'TIMEOUT');
  }

  static unknown(error: Error): AIServiceError {
    return new AIServiceError('An unexpected error occurred', 'UNKNOWN', error);
  }
}

// ============================================================================
// MOCK RESPONSE (Fallback)
// ============================================================================

const getMockResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI assistant. How can I help you today?";
  }
  
  if (lowerMessage.includes('help')) {
    return "I'm here to help! You can ask me questions, have a conversation, or use me for various tasks. What would you like to do?";
  }
  
  if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can assist you with?";
  }
  
  // Default intelligent response
  return `I understand you said: "${message}". I'm currently running in mock mode. To enable full AI capabilities, please configure the Gemini API key. How can I assist you further?`;
};

// ============================================================================
// SECURE API CALL (No API key in frontend!)
// ============================================================================

const callAIAPI = async (
  message: string,
  conversationHistory?: ConversationMessage[]
): Promise<string> => {
  try {
    // Call our secure edge function
    const response = await fetch(AI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      switch (data.code) {
        case 'TIMEOUT':
          throw new Error('AI request timed out');
        case 'INVALID_INPUT':
          throw new Error(data.error || 'Invalid input');
        case 'INPUT_TOO_LONG':
          throw new Error(data.error || 'Message too long');
        case 'MISSING_API_KEY':
        case 'INVALID_API_KEY':
          throw new Error('AI service configuration error');
        default:
          throw new Error(data.error || 'AI request failed');
      }
    }

    if (!data.success || !data.message) {
      throw new Error('Invalid response from AI service');
    }

    return data.message;
  } catch (error) {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error - unable to reach AI service');
    }
    throw error;
  }
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class AIService {
  private static instance: AIService;
  private conversationHistory: ConversationMessage[] = [];

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(message: string): Promise<AIResponse> {
    if (!message || !message.trim()) {
      throw new AIServiceError('Message cannot be empty', 'UNKNOWN');
    }

    const startTime = Date.now();

    try {
      // Call AI API with timeout
      const aiMessage = await Promise.race([
        callAIAPI(message, this.conversationHistory),
        this.createTimeout()
      ]);

      // Store in conversation history
      this.addToHistory('user', message);
      this.addToHistory('assistant', aiMessage);

      return {
        message: aiMessage,
        timestamp: new Date().toISOString(),
        model: 'gemini-pro',
        success: true,
      };

    } catch (error) {
      const elapsed = Date.now() - startTime;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || elapsed >= TIMEOUT_MS) {
          throw AIServiceError.timeoutError();
        }
        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw AIServiceError.networkError();
        }
        if (error.message.includes('AI service')) {
          throw new AIServiceError(
            'AI service temporarily unavailable. Please try again later.',
            'SERVER_ERROR'
          );
        }
        throw AIServiceError.apiError(error);
      }
      
      throw AIServiceError.unknown(new Error('Unknown error occurred'));
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Add message to history
   */
  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 messages to prevent memory issues
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, TIMEOUT_MS);
    });
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

const aiService = AIService.getInstance();

export const sendMessageToAI = (message: string): Promise<AIResponse> => {
  return aiService.sendMessage(message);
};

export const getConversationHistory = (): ConversationMessage[] => {
  return aiService.getHistory();
};

export const clearConversationHistory = (): void => {
  aiService.clearHistory();
};

export default aiService;
