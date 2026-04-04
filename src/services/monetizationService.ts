// ============================================================================
// MONETIZATION SERVICE - Lebanon Local Payment Methods (COD, OMT, Wish, Bank Transfer)
// ============================================================================
// This is a completely isolated module - does NOT modify existing services
// ============================================================================

import { supabase } from '../supabase';

// ============================================================================
// TYPES - Extended with Lebanon payment methods
// ============================================================================

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  type: 'physical' | 'digital';
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  stock_quantity: number | null;
  // E-commerce extensions
  cost_cents?: number | null;
  sku?: string | null;
  weight_grams?: number | null;
  dimensions?: Record<string, any> | null;
  tags?: string[] | null;
  bundle_discount_percent?: number | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: 'week' | 'month' | 'year';
  features: string[];
  limits: Record<string, any>;
  is_active: boolean;
  sort_order: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  total_cents: number;
  currency: string;
  paid_at: string | null;
  created_at: string;
  items?: OrderItem[];
  // Lebanon payment extensions
  payment_method?: 'cod' | 'omt' | 'wish' | 'bank_transfer';
  payment_status?: 'pending' | 'pending_cod' | 'pending_verification' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  payment_proof_required?: boolean;
  reference_number?: string | null;
  admin_notes?: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: 'cod' | 'omt' | 'wish' | 'bank_transfer';
  description: string | null;
  instructions: string | null;
  is_active: boolean;
  requires_proof: boolean;
  processing_time: string | null;
  icon_url: string | null;
  sort_order: number;
  metadata: Record<string, any>;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  image_url: string; // REQUIRED - NOT NULL
  reference_number: string | null;
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_reviewed_by: string | null;
  admin_reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  product?: Product;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  started_at: string;
  plan?: SubscriptionPlan;
}

// ============================================================================
// PRODUCTS SERVICE
// ============================================================================

export const productService = {
  /**
   * Get all active products
   */
  async getProducts(): Promise<{ data: Product[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('[ProductService] Error fetching products:', error);
      return { data: null, error };
    }
  },

  /**
   * Get single product by ID or SKU
   */
  async getProductById(id: string): Promise<{ data: Product | null; error: any }> {
    try {
      console.log('[ProductService] Looking for product with ID/slug:', id);
      
      // First try to fetch by UUID (id column)
      const { data: uuidData, error: uuidError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      console.log('[ProductService] UUID lookup - data:', uuidData ? 'Found' : 'null', 'error:', uuidError?.message || 'none');

      // If found by UUID, return it
      if (uuidData) {
        console.log('[ProductService] Found by UUID');
        return { data: uuidData, error: null };
      }

      // Not found by UUID, try fetching by SKU
      console.log('[ProductService] UUID not found, trying SKU match...');
      
      // Convert slug format (nfc-keychain) to uppercase for SKU matching
      const upperId = id.toUpperCase();
      console.log('[ProductService] Trying SKU pattern match with:', upperId);
      
      // Try pattern match (e.g., nfc-keychain -> NFC-KEYCHAIN%)
      const { data: skuData, error: skuError } = await supabase
        .from('products')
        .select('*')
        .ilike('sku', `${upperId}%`)
        .maybeSingle();
      
      console.log('[ProductService] SKU pattern match - data:', skuData ? `Found: ${skuData.name}` : 'null', 'error:', skuError?.message || 'none');
      
      if (skuData) {
        console.log('[ProductService] Success! Found product:', skuData.name);
        return { data: skuData, error: null };
      }
      
      // Also try without the hyphen for flexibility
      const noHyphenId = upperId.replace(/-/g, '');
      console.log('[ProductService] Trying without hyphens:', noHyphenId);
      
      const { data: altData } = await supabase
        .from('products')
        .select('*')
        .ilike('sku', `%${noHyphenId}%`)
        .maybeSingle();
      
      if (altData) {
        console.log('[ProductService] Found with alternative pattern:', altData.name);
        return { data: altData, error: null };
      }

      console.warn('[ProductService] Product not found with any method');
      return { data: null, error: null };
    } catch (error) {
      console.error('[ProductService] Error fetching product:', error);
      return { data: null, error };
    }
  },
};

// ============================================================================
// SUBSCRIPTION PLANS SERVICE
// ============================================================================

export const subscriptionPlanService = {
  /**
   * Get all active subscription plans
   */
  async getPlans(): Promise<{ data: SubscriptionPlan[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('[SubscriptionPlanService] Error fetching plans:', error);
      return { data: null, error };
    }
  },

  /**
   * Get single plan by ID
   */
  async getPlanById(id: string): Promise<{ data: SubscriptionPlan | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('[SubscriptionPlanService] Error fetching plan:', error);
      return { data: null, error };
    }
  },
};

// ============================================================================
// ORDERS SERVICE
// ============================================================================

export const orderService = {
  /**
   * Create new order
   */
  async createOrder(
    userId: string,
    items: Array<{ product_id: string; quantity: number }>
  ): Promise<{ data: Order | null; error: any }> {
    try {
      // Calculate total
      let totalCents = 0;
      const orderItems = [];

      for (const item of items) {
        const { data: product } = await productService.getProductById(item.product_id);
        if (!product) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        const itemTotal = product.price_cents * item.quantity;
        totalCents += itemTotal;

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_cents: product.price_cents,
          total_cents: itemTotal,
        });
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          total_cents: totalCents,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase.from('order_items').insert(
        orderItems.map((item) => ({
          order_id: order.id,
          ...item,
        }))
      );

      if (itemsError) throw itemsError;

      return { data: order, error: null };
    } catch (error) {
      console.error('[OrderService] Error creating order:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string): Promise<{ data: Order[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('[OrderService] Error fetching orders:', error);
      return { data: null, error };
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    metadata?: any
  ): Promise<{ error: any }> {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      return { error };
    } catch (error) {
      console.error('[OrderService] Error updating order:', error);
      return { error };
    }
  },
};

// ============================================================================
// SUBSCRIPTIONS SERVICE
// ============================================================================

export const subscriptionService = {
  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<{ data: Subscription | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      return { data, error };
    } catch (error) {
      console.error('[SubscriptionService] Error fetching subscription:', error);
      return { data: null, error };
    }
  },

  /**
   * Create new subscription (manual/local payment)
   */
  async createSubscription(
    userId: string,
    planId: string
  ): Promise<{ data: Subscription | null; error: any }> {
    try {
      // Cancel any existing active subscriptions
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .in('status', ['active', 'trialing']);

      // Get plan details
      const { data: plan } = await subscriptionPlanService.getPlanById(planId);
      if (!plan) throw new Error('Plan not found');

      // Calculate period end
      const now = new Date();
      const periodEnd = new Date(now);
      
      if (plan.interval === 'week') {
        periodEnd.setDate(periodEnd.getDate() + 7);
      } else if (plan.interval === 'month') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else if (plan.interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      // Create subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select('*, plan:subscription_plans(*)')
        .single();

      return { data, error };
    } catch (error) {
      console.error('[SubscriptionService] Error creating subscription:', error);
      return { data: null, error };
    }
  },

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(subscriptionId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      return { error };
    } catch (error) {
      console.error('[SubscriptionService] Error canceling subscription:', error);
      return { error };
    }
  },
};

// ============================================================================
// LEBANON LOCAL PAYMENT METHODS SERVICE
// ============================================================================

export const localPaymentService = {
  /**
   * Get all active payment methods
   */
  async getPaymentMethods(): Promise<{ data: PaymentMethod[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('[LocalPaymentService] Error fetching payment methods:', error);
      return { data: null, error };
    }
  },

  /**
   * Create COD order (Cash on Delivery)
   */
  async createCODOrder(
    userId: string,
    items: Array<{ product_id: string; quantity: number }>,
    shippingAddress?: any
  ): Promise<{ data: Order | null; error: any }> {
    try {
      // First create the order using existing order service
      const { data: order, error: orderError } = await orderService.createOrder(userId, items);
      
      if (orderError || !order) {
        return { data: null, error: orderError };
      }

      // Update order with COD payment details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_method: 'cod',
          payment_status: 'pending_cod',
          payment_proof_required: false,
          shipping_address: shippingAddress,
        })
        .eq('id', order.id);

      if (updateError) {
        return { data: null, error: updateError };
      }

      // Fetch updated order
      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('id', order.id)
        .single();

      return { data: updatedOrder, error: null };
    } catch (error) {
      console.error('[LocalPaymentService] Error creating COD order:', error);
      return { data: null, error };
    }
  },

  /**
   * Create local payment order (OMT/Wish/Bank Transfer) - REQUIRES proof
   */
  async createLocalPaymentOrder(
    userId: string,
    items: Array<{ product_id: string; quantity: number }>,
    paymentMethod: 'omt' | 'wish' | 'bank_transfer',
    referenceNumber: string,
    proofImageUrl: string // MANDATORY - cannot be null
  ): Promise<{ data: Order | null; error: any }> {
    try {
      // Validate proof URL is provided (MANDATORY)
      if (!proofImageUrl || proofImageUrl.trim() === '') {
        return { 
          data: null, 
          error: new Error('Payment proof image is REQUIRED. Cannot create order without proof.') 
        };
      }

      // Create order first
      const { data: order, error: orderError } = await orderService.createOrder(userId, items);
      
      if (orderError || !order) {
        return { data: null, error: orderError };
      }

      // Update order with local payment details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_method: paymentMethod,
          payment_status: 'pending_verification',
          payment_proof_required: true,
          reference_number: referenceNumber,
        })
        .eq('id', order.id);

      if (updateError) {
        return { data: null, error: updateError };
      }

      // Create payment proof record (MANDATORY)
      const { error: proofError } = await supabase
        .from('payment_proofs')
        .insert({
          order_id: order.id,
          image_url: proofImageUrl, // REQUIRED - NOT NULL
          reference_number: referenceNumber,
          submitted_by: userId,
          status: 'pending',
        });

      if (proofError) {
        // Rollback order if proof creation fails
        await supabase.from('orders').delete().eq('id', order.id);
        return { data: null, error: proofError };
      }

      // Fetch complete order with proof
      const { data: updatedOrder } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, product:products(*)),
          payment_proofs(*)
        `)
        .eq('id', order.id)
        .single();

      return { data: updatedOrder, error: null };
    } catch (error) {
      console.error('[LocalPaymentService] Error creating local payment order:', error);
      return { data: null, error };
    }
  },

  /**
   * Upload payment proof image to Supabase Storage
   */
  async uploadPaymentProof(
    file: File,
    orderId: string,
    userId: string
  ): Promise<{ imageUrl: string | null; error: any }> {
    try {
      // Validate file
      if (!file) {
        return { imageUrl: null, error: new Error('No file provided') };
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { imageUrl: null, error: new Error('File size must be less than 5MB') };
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        return { imageUrl: null, error: new Error('Only JPG, PNG, and WebP images are allowed') };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${orderId}_${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads') // You may need to create this bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[LocalPaymentService] Upload error:', uploadError);
        return { imageUrl: null, error: uploadError };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      return { imageUrl: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('[LocalPaymentService] Error uploading proof:', error);
      return { imageUrl: null, error };
    }
  },

  /**
   * Submit payment proof for an existing order
   */
  async submitPaymentProof(
    orderId: string,
    userId: string,
    imageUrl: string,
    referenceNumber?: string
  ): Promise<{ data: PaymentProof | null; error: any }> {
    try {
      // Validate image URL is provided (MANDATORY)
      if (!imageUrl || imageUrl.trim() === '') {
        return { 
          data: null, 
          error: new Error('Payment proof image URL is REQUIRED') 
        };
      }

      // Create proof record
      const { data, error } = await supabase
        .from('payment_proofs')
        .insert({
          order_id: orderId,
          image_url: imageUrl,
          reference_number: referenceNumber,
          submitted_by: userId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      // Update order status
      await supabase
        .from('orders')
        .update({
          payment_status: 'pending_verification',
          payment_proof_required: true,
        })
        .eq('id', orderId);

      return { data, error: null };
    } catch (error) {
      console.error('[LocalPaymentService] Error submitting proof:', error);
      return { data: null, error };
    }
  },

  /**
   * Get payment proofs for an order
   */
  async getOrderProofs(orderId: string): Promise<{ data: PaymentProof[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('[LocalPaymentService] Error fetching proofs:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's orders with specific payment status
   */
  async getUserOrdersByPaymentStatus(
    userId: string,
    status: Order['payment_status']
  ): Promise<{ data: Order[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*)), payment_proofs(*)')
        .eq('user_id', userId)
        .eq('payment_status', status)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('[LocalPaymentService] Error fetching orders by status:', error);
      return { data: null, error };
    }
  },
};
