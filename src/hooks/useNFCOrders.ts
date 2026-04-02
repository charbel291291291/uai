import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services';
import type { NFCOrder } from '../types';

// ============================================================================
// USE NFC ORDERS ADMIN HOOK
// ============================================================================

interface UseNFCOrdersAdminReturn {
  orders: NFCOrder[];
  loading: boolean;
  error: string | null;
  fetchOrders: (statusFilter?: string) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    newStatus: string,
    trackingNumber?: string,
    carrier?: string,
    adminNotes?: string
  ) => Promise<boolean>;
}

export function useNFCOrdersAdmin(): UseNFCOrdersAdminReturn {
  const [orders, setOrders] = useState<NFCOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (statusFilter?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: serviceError } = await orderService.getAllOrders(statusFilter);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

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
      const { error: serviceError } = await orderService.updateOrderStatus({
        orderId,
        status: newStatus,
        trackingNumber,
        carrier,
        adminNotes,
      });

      if (serviceError) {
        throw new Error(serviceError.message);
      }

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

// ============================================================================
// USE USER NFC ORDERS HOOK
// ============================================================================

interface UseUserNFCOrdersReturn {
  orders: NFCOrder[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<boolean>;
}

export function useUserNFCOrders(userId: string | undefined): UseUserNFCOrdersReturn {
  const [orders, setOrders] = useState<NFCOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: serviceError } = await orderService.getUserOrders(userId);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setOrders(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const cancelOrder = useCallback(async (orderId: string, reason?: string): Promise<boolean> => {
    try {
      const { error: serviceError } = await orderService.cancelOrder(orderId, reason);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

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
    refetch: fetchOrders,
    cancelOrder,
  };
}

// ============================================================================
// USE CREATE NFC ORDER HOOK
// ============================================================================

interface UseCreateNFCOrderReturn {
  createOrder: (data: {
    productType: string;
    quantity: number;
    shippingAddress: {
      fullName: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phone: string;
    };
    totalAmount: number;
  }) => Promise<{ success: boolean; order?: NFCOrder; error?: string }>;
  loading: boolean;
  error: string | null;
}

export function useCreateNFCOrder(userId: string | undefined): UseCreateNFCOrderReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (data: {
    productType: string;
    quantity: number;
    shippingAddress: {
      fullName: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phone: string;
    };
    totalAmount: number;
  }): Promise<{ success: boolean; order?: NFCOrder; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data: order, error: serviceError } = await orderService.createOrder({
        userId,
        ...data,
      });

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      return { success: true, order: order || undefined };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    createOrder,
    loading,
    error,
  };
}
