import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { NFCOrder } from '../types';

export function useNFCOrdersAdmin() {
  const [orders, setOrders] = useState<NFCOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (statusFilter?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('nfc_orders')
        .select(`
          *,
          user:profiles(username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (
    orderId: string,
    newStatus: string,
    trackingNumber?: string,
    carrier?: string,
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.rpc('update_nfc_order', {
        order_id: orderId,
        new_status: newStatus,
        tracking_num: trackingNumber || null,
        carrier: carrier || null,
        admin_note: adminNotes || null,
        admin_id: user?.id,
      });

      if (error) throw error;

      await fetchOrders();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
  };
}

// Hook for user to view their own orders
export function useUserNFCOrders(userId: string | undefined) {
  const [orders, setOrders] = useState<NFCOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const { data } = await supabase
      .from('nfc_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setOrders(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, refetch: fetchOrders };
}
