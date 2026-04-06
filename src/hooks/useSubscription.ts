import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services';
import type { Subscription, PaymentRequest, UserPlan } from '../types';

// ============================================================================
// USE SUBSCRIPTION HOOK
// ============================================================================

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  paymentHistory: PaymentRequest[];
  loading: boolean;
  error: string | null;
  hasFeature: (feature: string) => boolean;
  isPlan: (plan: UserPlan) => boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  refetch: () => Promise<void>;
}

const FEATURE_MAP: Record<string, UserPlan[]> = {
  'ai-mode': ['pro', 'elite'],
  'sales-mode': ['elite'],
  'unlimited-services': ['pro', 'elite'],
  'analytics': ['pro', 'elite'],
  'premium-themes': ['pro', 'elite'],
  'advanced-analytics': ['elite'],
  'nfc-priority': ['elite'],
  'custom-domain': ['elite'],
};

export function useSubscription(userId: string | undefined): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch payment history using service
      const { data: payments, error: paymentError } = await orderService.getUserPaymentHistory(userId);
      
      if (paymentError) {
        throw new Error(paymentError.message);
      }

      setPaymentHistory(payments || []);

      // Derive subscription from most recent approved payment
      const approvedPayments = (payments || []).filter(p => p.status === 'approved');
      const mostRecent = approvedPayments[0];

      if (mostRecent) {
        // Calculate expiry (30 days from approval)
        const approvedAt = new Date(mostRecent.reviewed_at || mostRecent.created_at);
        const expiresAt = new Date(approvedAt);
        expiresAt.setDate(expiresAt.getDate() + 30);

        setSubscription({
          id: mostRecent.id,
          user_id: userId,
          plan: mostRecent.plan,
          status: new Date() > expiresAt ? 'expired' : 'active',
          started_at: approvedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_request_id: mostRecent.id,
          auto_renew: false,
          created_at: mostRecent.created_at,
          updated_at: mostRecent.reviewed_at || mostRecent.created_at,
        });
      } else {
        setSubscription(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check if user has a specific feature
  const hasFeature = useCallback((feature: string): boolean => {
    const plan = subscription?.plan || 'free';
    const requiredPlan = FEATURE_MAP[feature];
    if (!requiredPlan) return true;
    return requiredPlan.includes(plan);
  }, [subscription?.plan]);

  // Check if user is on specific plan
  const isPlan = useCallback((plan: UserPlan): boolean => {
    return subscription?.plan === plan;
  }, [subscription?.plan]);

  // Check if subscription is expired
  const isExpired = subscription?.status === 'expired' ||
    (subscription?.expires_at ? new Date(subscription.expires_at) < new Date() : false);

  // Calculate days remaining
  const daysRemaining = subscription?.expires_at
    ? Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    subscription,
    paymentHistory,
    loading,
    error,
    hasFeature,
    isPlan,
    isExpired,
    daysRemaining,
    refetch: fetchSubscription,
  };
}

// ============================================================================
// USE CREATE PAYMENT REQUEST HOOK
// ============================================================================

interface UseCreatePaymentRequestReturn {
  createPaymentRequest: (
    plan: Exclude<UserPlan, 'free'>,
    paymentMethod: string,
    proofFile: File
  ) => Promise<{ success: boolean; data?: PaymentRequest; error?: string }>;
  loading: boolean;
  error: string | null;
}

export function useCreatePaymentRequest(userId: string | undefined): UseCreatePaymentRequestReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentRequest = useCallback(async (
    plan: Exclude<UserPlan, 'free'>,
    paymentMethod: string,
    proofFile: File
  ): Promise<{ success: boolean; data?: PaymentRequest; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: serviceError } = await orderService.createPaymentRequest({
        userId,
        plan,
        paymentMethod,
        proofFile,
      });

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      return { success: true, data: data || undefined };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    createPaymentRequest,
    loading,
    error,
  };
}

// ============================================================================
// USE ADMIN PAYMENTS HOOK
// ============================================================================

interface UseAdminPaymentsReturn {
  paymentRequests: PaymentRequest[];
  loading: boolean;
  error: string | null;
  fetchPendingPayments: () => Promise<void>;
  approvePayment: (paymentId: string, adminNotes?: string) => Promise<boolean>;
  rejectPayment: (paymentId: string, adminNotes: string) => Promise<boolean>;
}

export function useAdminPayments(): UseAdminPaymentsReturn {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch ALL payment requests so the UI can filter client-side by status
      const { data, error: serviceError } = await orderService.getAllPayments();

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setPaymentRequests(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const approvePayment = useCallback(async (
    paymentId: string,
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      const { error: serviceError } = await orderService.approvePayment({
        paymentId,
        adminNotes,
      });

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      await fetchPendingPayments();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchPendingPayments]);

  const rejectPayment = useCallback(async (
    paymentId: string,
    adminNotes: string
  ): Promise<boolean> => {
    try {
      const { error: serviceError } = await orderService.rejectPayment(paymentId, adminNotes);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      await fetchPendingPayments();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchPendingPayments]);

  return {
    paymentRequests,
    loading,
    error,
    fetchPendingPayments,
    approvePayment,
    rejectPayment,
  };
}
