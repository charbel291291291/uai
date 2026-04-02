import { useState, useEffect, useCallback } from 'react';
import { contactMessageService } from '../services';
import type { 
  ContactMessage, 
  ContactMessageStatus, 
  ContactMessageCategory,
  ContactMessagePriority 
} from '../types';

// ============================================================================
// USE CONTACT MESSAGES HOOK (Admin)
// ============================================================================

interface UseContactMessagesReturn {
  messages: ContactMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateMessage: (messageId: string, data: {
    status?: ContactMessageStatus;
    priority?: ContactMessagePriority;
    assignedTo?: string;
    adminNotes?: string;
  }) => Promise<boolean>;
  assignMessage: (messageId: string, adminId: string) => Promise<boolean>;
  markAsResponded: (messageId: string) => Promise<boolean>;
  resolveMessage: (messageId: string, adminNotes?: string) => Promise<boolean>;
  markAsSpam: (messageId: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
}

export function useContactMessages(
  status?: ContactMessageStatus,
  category?: ContactMessageCategory,
  priority?: ContactMessagePriority
): UseContactMessagesReturn {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await contactMessageService.getAllMessages({
        status,
        category,
        priority,
      });

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, category, priority]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const updateMessage = useCallback(async (
    messageId: string,
    data: {
      status?: ContactMessageStatus;
      priority?: ContactMessagePriority;
      assignedTo?: string;
      adminNotes?: string;
    }
  ): Promise<boolean> => {
    try {
      const { error: serviceError } = await contactMessageService.updateMessage(messageId, data);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      await fetchMessages();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMessages]);

  const assignMessage = useCallback(async (messageId: string, adminId: string): Promise<boolean> => {
    try {
      const { error: serviceError } = await contactMessageService.assignMessage(messageId, adminId);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      await fetchMessages();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMessages]);

  const markAsResponded = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const { error: serviceError } = await contactMessageService.markAsResponded(messageId);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      await fetchMessages();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMessages]);

  const resolveMessage = useCallback(async (messageId: string, adminNotes?: string): Promise<boolean> => {
    try {
      const { error: serviceError } = await contactMessageService.resolveMessage(messageId, adminNotes);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      await fetchMessages();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMessages]);

  const markAsSpam = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const { error: serviceError } = await contactMessageService.markAsSpam(messageId);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      await fetchMessages();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMessages]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const { error: serviceError } = await contactMessageService.deleteMessage(messageId);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      await fetchMessages();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    updateMessage,
    assignMessage,
    markAsResponded,
    resolveMessage,
    markAsSpam,
    deleteMessage,
  };
}

// ============================================================================
// USE CONTACT MESSAGE STATS HOOK
// ============================================================================

interface UseContactMessageStatsReturn {
  stats: {
    new: number;
    in_progress: number;
    resolved: number;
    urgent: number;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useContactMessageStats(): UseContactMessageStatsReturn {
  const [stats, setStats] = useState<{
    new: number;
    in_progress: number;
    resolved: number;
    urgent: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await contactMessageService.getMessageStats();

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// ============================================================================
// USE CREATE CONTACT MESSAGE HOOK
// ============================================================================

interface UseCreateContactMessageReturn {
  createMessage: (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    category?: ContactMessageCategory;
  }) => Promise<{ success: boolean; message?: ContactMessage; error?: string }>;
  loading: boolean;
  error: string | null;
}

export function useCreateContactMessage(userId?: string): UseCreateContactMessageReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMessage = useCallback(async (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    category?: ContactMessageCategory;
  }): Promise<{ success: boolean; message?: ContactMessage; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: message, error: serviceError } = await contactMessageService.createMessage({
        ...data,
        userId,
      });

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      return { success: true, message: message || undefined };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    createMessage,
    loading,
    error,
  };
}

// ============================================================================
// USE USER CONTACT MESSAGES HOOK
// ============================================================================

interface UseUserContactMessagesReturn {
  messages: ContactMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserContactMessages(userId: string | undefined): UseUserContactMessagesReturn {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await contactMessageService.getUserMessages(userId);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
  };
}
