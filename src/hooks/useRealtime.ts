import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Hook for subscribing to realtime changes on any table
export function useRealtimeTable<T>(
  table: string,
  filter: { column: string; value: string } | null,
  onChange: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!filter) return;

    const channel = supabase
      .channel(`${table}:${filter.value}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        onChange
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [table, filter?.column, filter?.value, onChange]);

  return channelRef.current;
}

// Hook for AI conversations realtime
export function useRealtimeConversations(profileId: string | undefined) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [newMessageCount, setNewMessageCount] = useState(0);

  useEffect(() => {
    if (!profileId) return;

    // Initial fetch
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('profile_id', profileId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false });

      setConversations(data || []);
    };

    fetchConversations();

    // Subscribe to new conversations and updates
    const channel = supabase
      .channel(`conversations:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_conversations',
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations((prev) => [payload.new, ...prev]);
            setNewMessageCount((c) => c + 1);
          } else if (payload.eventType === 'UPDATE') {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === payload.new.id ? payload.new : conv
              )
            );
            if (payload.new.last_message_at !== payload.old?.last_message_at) {
              setNewMessageCount((c) => c + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profileId]);

  const markAsRead = useCallback(() => {
    setNewMessageCount(0);
  }, []);

  return { conversations, newMessageCount, markAsRead };
}

// Hook for single conversation realtime updates
export function useRealtimeConversation(conversationId: string | undefined) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    // Initial fetch
    const fetchConversation = async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      if (data) {
        setMessages(data.messages || []);
      }
    };

    fetchConversation();

    // Subscribe to message updates
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new.messages) {
            setMessages(payload.new.messages);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  const sendMessage = useCallback(async (text: string, sender: string, senderName?: string) => {
    if (!conversationId || !text.trim()) return;

    const { error } = await supabase.rpc('add_conversation_message', {
      conv_id: conversationId,
      message_text: text.trim(),
      sender_type: sender,
      sender_name: senderName,
    });

    if (error) {
      console.error('Failed to send message:', error);
    }
  }, [conversationId]);

  return { messages, sendMessage, isTyping, setIsTyping };
}

// Hook for notifications realtime
export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.read).length || 0);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((c) => c + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
          );
          // Recalculate unread count
          setNotifications((prev) => {
            const updated = prev.map((n) =>
              n.id === payload.new.id ? payload.new : n
            );
            setUnreadCount(updated.filter((n) => !n.read).length);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId?: string) => {
    if (!userId) return;

    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } else {
      // Mark all as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    }
  }, [userId]);

  const dismissNotification = useCallback(async (notificationId: string) => {
    await supabase.from('notifications').delete().eq('id', notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    dismissNotification,
  };
}

// Hook for NFC orders realtime (for users)
export function useRealtimeNFCOrders(userId: string | undefined) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('nfc_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setOrders(data || []);
    };

    fetchOrders();

    // Subscribe to order updates
    const channel = supabase
      .channel(`nfc_orders:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nfc_orders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id ? payload.new : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { orders };
}

// Hook for payment requests realtime
export function useRealtimePayments(userId: string | undefined) {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetchPayments = async () => {
      const { data } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setPayments(data || []);
    };

    fetchPayments();

    const channel = supabase
      .channel(`payments:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPayments((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPayments((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { payments };
}
