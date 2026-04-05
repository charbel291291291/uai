import { apiClient } from './apiClient';
import type { NFCOrder, PaymentRequest, UserPlan } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateOrderData {
  userId: string;
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
}

export interface UpdateOrderStatusData {
  orderId: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
  adminNotes?: string;
}

export interface CreatePaymentData {
  userId: string;
  plan: Exclude<UserPlan, 'free'>;
  paymentMethod: string;
  proofFile: File;
}

export interface PaymentApprovalData {
  paymentId: string;
  adminNotes?: string;
}

// ============================================================================
// ORDER SERVICE
// ============================================================================

class OrderService {
  private supabase = apiClient.supabase;

  // ==========================================================================
  // NFC ORDERS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Create NFC Order
  // --------------------------------------------------------------------------
  async createOrder(data: CreateOrderData) {
    try {
      const { data: order, error } = await this.supabase
        .from('nfc_orders')
        .insert({
          user_id: data.userId,
          product_type: data.productType,
          quantity: data.quantity,
          shipping_address: data.shippingAddress,
          total_amount: data.totalAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return apiClient.createResponse<NFCOrder>(order, null);
    } catch (error: any) {
      return apiClient.createResponse<NFCOrder>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get User Orders
  // --------------------------------------------------------------------------
  async getUserOrders(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('nfc_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return apiClient.createResponse<NFCOrder[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<NFCOrder[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Order by ID
  // --------------------------------------------------------------------------
  async getOrderById(orderId: string) {
    try {
      const { data, error } = await this.supabase
        .from('nfc_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return apiClient.createResponse<NFCOrder>(data, null);
    } catch (error: any) {
      return apiClient.createResponse<NFCOrder>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get All Orders (Admin)
  // --------------------------------------------------------------------------
  async getAllOrders(statusFilter?: string) {
    try {
      let query = this.supabase
        .from('orders')
        .select(`
          id,
          status,
          total_cents,
          created_at,
          payment_method,
          payment_status,
          profiles (
            id,
            username,
            display_name
          ),
          order_items (
            quantity,
            total_cents,
            products (
              name,
              price_cents
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const normalizedOrders = (data || []).map((order: any) => {
        const itemNames = (order.order_items || [])
          .map((item: any) => item.products?.name)
          .filter(Boolean)
          .join(', ');

        return {
          id: order.id,
          user_id: order.profiles?.id || '',
          product_type: 'card',
          name: itemNames || 'Order',
          status: order.status,
          price: ((order.total_cents || 0) / 100),
          total_cents: order.total_cents || 0,
          created_at: order.created_at,
          profiles: order.profiles || null,
          user: order.profiles
            ? {
                username: order.profiles.username,
                display_name: order.profiles.display_name,
              }
            : undefined,
          order_items: order.order_items || [],
          payment_method: order.payment_method,
          payment_status: order.payment_status,
        };
      });

      return apiClient.createResponse<NFCOrder[]>(normalizedOrders as NFCOrder[], null);
    } catch (error: any) {
      return apiClient.createResponse<NFCOrder[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Update Order Status
  // --------------------------------------------------------------------------
  async updateOrderStatus(data: UpdateOrderStatusData) {
    try {
      const updatePayload: Record<string, any> = {
        status: data.status,
        updated_at: new Date().toISOString(),
      };

      if (data.trackingNumber) {
        updatePayload.tracking_number = data.trackingNumber;
      }

      if (data.adminNotes) {
        updatePayload.admin_notes = data.adminNotes;
      }

      const { error } = await this.supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', data.orderId);

      if (error) throw error;

      return apiClient.createResponse<boolean>(true, null);
    } catch (error: any) {
      return apiClient.createResponse<boolean>(false, error);
    }
  }

  // --------------------------------------------------------------------------
  // Cancel Order
  // --------------------------------------------------------------------------
  async cancelOrder(orderId: string, reason?: string) {
    try {
      const { error } = await this.supabase
        .from('orders')
        .update({
          status: 'cancelled',
          admin_notes: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      return apiClient.createResponse<boolean>(true, null);
    } catch (error: any) {
      return apiClient.createResponse<boolean>(false, error);
    }
  }

  // ==========================================================================
  // PAYMENTS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Create Payment Request
  // --------------------------------------------------------------------------
  async createPaymentRequest(data: CreatePaymentData) {
    try {
      // Upload proof image
      const fileName = `${data.userId}/${Date.now()}_payment_proof.jpg`;
      const { error: uploadError } = await this.supabase.storage
        .from('payment-proofs')
        .upload(fileName, data.proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      // Calculate amount
      const amount = data.plan === 'pro' ? 5 : 10;

      // Create payment request
      const { data: payment, error: insertError } = await this.supabase
        .from('payment_requests')
        .insert({
          user_id: data.userId,
          plan: data.plan,
          payment_method: data.paymentMethod,
          proof_image_url: publicUrl,
          amount,
          currency: 'USD',
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return apiClient.createResponse<PaymentRequest>(payment, null);
    } catch (error: any) {
      return apiClient.createResponse<PaymentRequest>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get User Payment History
  // --------------------------------------------------------------------------
  async getUserPaymentHistory(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return apiClient.createResponse<PaymentRequest[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<PaymentRequest[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Pending Payments (Admin)
  // --------------------------------------------------------------------------
  async getPendingPayments() {
    try {
      const { data, error } = await this.supabase
        .from('payment_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const payments = data || [];

      if (payments.length === 0) {
        return apiClient.createResponse<PaymentRequest[]>([], null);
      }

      const userIds = [...new Set(payments.map((payment) => payment.user_id).filter(Boolean))];
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
      const enrichedPayments = payments.map((payment) => ({
        ...payment,
        user: profileMap.get(payment.user_id) || null,
      }));

      return apiClient.createResponse<PaymentRequest[]>(enrichedPayments, null);
    } catch (error: any) {
      return apiClient.createResponse<PaymentRequest[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Approve Payment
  // --------------------------------------------------------------------------
  async approvePayment(data: PaymentApprovalData) {
    try {
      const { data: userData } = await this.supabase.auth.getUser();
      const adminId = userData.user?.id;

      const { error } = await this.supabase.rpc('approve_payment_request', {
        request_id: data.paymentId,
        admin_id: adminId,
        notes: data.adminNotes,
      });

      if (error) throw error;

      return apiClient.createResponse<boolean>(true, null);
    } catch (error: any) {
      return apiClient.createResponse<boolean>(false, error);
    }
  }

  // --------------------------------------------------------------------------
  // Reject Payment
  // --------------------------------------------------------------------------
  async rejectPayment(paymentId: string, adminNotes: string) {
    try {
      const { data: userData } = await this.supabase.auth.getUser();
      const adminId = userData.user?.id;

      const { error } = await this.supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq('id', paymentId);

      if (error) throw error;

      return apiClient.createResponse<boolean>(true, null);
    } catch (error: any) {
      return apiClient.createResponse<boolean>(false, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Payment Stats (Admin)
  // --------------------------------------------------------------------------
  async getPaymentStats() {
    try {
      const { data: pending, error: pendingError } = await this.supabase
        .from('payment_requests')
        .select('count')
        .eq('status', 'pending');

      const { data: approved, error: approvedError } = await this.supabase
        .from('payment_requests')
        .select('count')
        .eq('status', 'approved');

      const { data: totalRevenue, error: revenueError } = await this.supabase
        .from('payment_requests')
        .select('amount')
        .eq('status', 'approved');

      if (pendingError || approvedError || revenueError) {
        throw pendingError || approvedError || revenueError;
      }

      const stats = {
        pending: pending?.[0]?.count || 0,
        approved: approved?.[0]?.count || 0,
        totalRevenue: totalRevenue?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      };

      return apiClient.createResponse(stats, null);
    } catch (error: any) {
      return apiClient.createResponse(null, error);
    }
  }
}

// Singleton instance
const orderService = new OrderService();
export default orderService;

// Export individual functions for convenience
export const {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  createPaymentRequest,
  getUserPaymentHistory,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getPaymentStats,
} = orderService;
