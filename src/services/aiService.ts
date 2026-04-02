import { GoogleGenerativeAI } from '@google/generative-ai';

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
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIError {
  message: string;
  code: 'API_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN';
  originalError?: Error;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-pro';
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
// GEMINI API INTEGRATION
// ============================================================================

const callGeminiAPI = async (
  message: string,
  conversationHistory?: ConversationMessage[]
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    console.warn('[AI Service] No API key found, using mock response');
    return getMockResponse(message);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Build prompt with conversation history if available
    let prompt = message;
    if (conversationHistory && conversationHistory.length > 0) {
      const historyText = conversationHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      prompt = `${historyText}\nassistant: ${message}`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
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
        callGeminiAPI(message, this.conversationHistory),
        this.createTimeout()
      ]);

      // Store in conversation history
      this.addToHistory('user', message);
      this.addToHistory('assistant', aiMessage);

      return {
        message: aiMessage,
        timestamp: new Date().toISOString(),
        model: GEMINI_MODEL
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
