import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Subscription, PaymentRequest, UserPlan } from '../types';

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

      // Fetch current subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      setSubscription(subData);

      // Fetch payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (paymentError) throw paymentError;

      setPaymentHistory(paymentData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check if user has a specific feature based on plan
  const hasFeature = useCallback((feature: string): boolean => {
    const plan = subscription?.plan || 'free';

    const features: Record<string, UserPlan[]> = {
      'ai-mode': ['pro', 'elite'],
      'sales-mode': ['elite'],
      'unlimited-services': ['pro', 'elite'],
      'analytics': ['pro', 'elite'],
      'premium-themes': ['pro', 'elite'],
      'advanced-analytics': ['elite'],
      'nfc-priority': ['elite'],
      'custom-domain': ['elite'],
    };

    const requiredPlan = features[feature];
    if (!requiredPlan) return true; // Free feature

    return requiredPlan.includes(plan);
  }, [subscription?.plan]);

  // Check if user is on specific plan
  const isPlan = useCallback((plan: UserPlan): boolean => {
    return subscription?.plan === plan;
  }, [subscription?.plan]);

  // Check if subscription is expired
  const isExpired = useCallback((): boolean => {
    if (!subscription?.expires_at) return false;
    return new Date(subscription.expires_at) < new Date();
  }, [subscription?.expires_at]);

  // Calculate days remaining
  const daysRemaining = useCallback((): number | null => {
    if (!subscription?.expires_at) return null;
    const expiry = new Date(subscription.expires_at);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [subscription?.expires_at])();

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

// Hook for creating payment requests
export function useCreatePaymentRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentRequest = useCallback(async (
    userId: string,
    plan: Exclude<UserPlan, 'free'>,
    paymentMethod: string,
    proofFile: File
  ): Promise<{ success: boolean; data?: PaymentRequest; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Upload proof image
      const fileName = `${userId}/${Date.now()}_payment_proof.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      // Create payment request
      const amount = plan === 'pro' ? 5 : 10;

      const { data, error: insertError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: userId,
          plan,
          payment_method: paymentMethod,
          proof_image_url: publicUrl,
          amount,
          currency: 'USD',
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPaymentRequest, loading, error };
}

// Hook for admin to manage payments
export function useAdminPayments() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          user:profiles(username, display_name, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      const { error } = await supabase.rpc('approve_payment_request', {
        request_id: paymentId,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        notes: adminNotes,
      });

      if (error) throw error;

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
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq('id', paymentId);

      if (error) throw error;

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
