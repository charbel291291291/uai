import { useState, useCallback } from 'react';
import { sendMessageToAI, getConversationHistory, type ConversationMessage, type AIResponse } from '../services/aiService';

interface UseAIChatReturn {
  messages: ConversationMessage[];
  loading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<AIResponse | null>;
  clearHistory: () => void;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (message: string): Promise<AIResponse | null> => {
    if (!message.trim()) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Add user message to state immediately
      const userMessage: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const response = await sendMessageToAI(message);

      // Add assistant message to state
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
      };

      setMessages(prev => [...prev, assistantMessage]);

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearHistory,
  };
}

export default useAIChat;
