// ============================================================================
// NFC E-COMMERCE SERVICE - Shopping Cart, Checkout & Delivery
// ============================================================================
// Extends monetizationService with full e-commerce functionality
// Modular and isolated - does NOT break existing code
// ============================================================================

import { supabase } from '../supabase';
import type { Product, Order } from './monetizationService';

// ============================================================================
// TYPES
// ============================================================================

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  added_at: string;
  product?: Product;
}

interface LocalCartEntry {
  product_id: string;
  quantity: number;
  added_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  city: string;
  area: string | null;
  address_details: string | null;
  is_default: boolean;
}

export interface DeliveryZone {
  id: string;
  city: string;
  area: string | null;
  delivery_fee_cents: number;
  estimated_days: number;
}

export interface ProductBundle {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number;
  items?: Array<{
    product: Product;
    quantity: number;
  }>;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface CheckoutItemInput {
  product_id: string;
  quantity: number;
  price: number;
}

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

const debugCheckoutLog = (message: string, payload?: unknown) => {
  if (!isDev) return;
  console.log(`[Checkout] ${message}`, payload);
};

const LOCAL_CART_KEY = 'cart';

const isBrowser = () => typeof window !== 'undefined';
const isCheckoutPath = () => isBrowser() && window.location.pathname.includes('checkout');
const dispatchCartUpdated = () => {
  if (!isBrowser() || isCheckoutPath()) return;
  window.dispatchEvent(new CustomEvent('cart-updated'));
};

const getStoredLocalCart = (): LocalCartEntry[] => {
  if (!isBrowser()) return [];
  if (isCheckoutPath()) return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.filter((item): item is LocalCartEntry =>
          Boolean(item && typeof item.product_id === 'string' && typeof item.quantity === 'number')
        )
      : [];
  } catch (error) {
    console.error('[CartService] Error reading local cart:', error);
    return [];
  }
};

const saveStoredLocalCart = (items: LocalCartEntry[]) => {
  if (!isBrowser()) return;

  window.localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  dispatchCartUpdated();
};

const clearStoredLocalCart = () => {
  if (!isBrowser()) return;

  window.localStorage.removeItem(LOCAL_CART_KEY);
  dispatchCartUpdated();
};

const resolveCartUserId = async (userId?: string): Promise<string | null> => {
  if (userId) return userId;

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

// ============================================================================
// CART SERVICE
// ============================================================================

export const cartService = {
  getLocalCart() {
    return getStoredLocalCart();
  },

  async syncCartAfterLogin(userId?: string): Promise<{ error: any }> {
    try {
      const resolvedUserId = await resolveCartUserId(userId);
      const localCart = getStoredLocalCart();

      if (!resolvedUserId || localCart.length === 0) {
        return { error: null };
      }

      for (const item of localCart) {
        const { error } = await this.addToCart(resolvedUserId, item.product_id, item.quantity);
        if (error) {
          return { error };
        }
      }

      clearStoredLocalCart();
      return { error: null };
    } catch (error) {
      console.error('[CartService] Error syncing local cart:', error);
      return { error };
    }
  },

  /**
   * Add product to cart (or update quantity if exists)
   */
  async addToCart(
    userId: string | undefined,
    productId: string,
    quantity: number = 1
  ): Promise<{ data: CartItem | null; error: any }> {
    try {
      const resolvedUserId = await resolveCartUserId(userId);

      if (!resolvedUserId) {
        const cart = getStoredLocalCart();
        const existing = cart.find((item) => item.product_id === productId);

        if (existing) {
          existing.quantity += quantity;
        } else {
          cart.push({
            product_id: productId,
            quantity,
            added_at: new Date().toISOString(),
          });
        }

        saveStoredLocalCart(cart);

        return {
          data: {
            id: productId,
            user_id: 'guest',
            product_id: productId,
            quantity: existing?.quantity ?? quantity,
            added_at: existing?.added_at ?? new Date().toISOString(),
          },
          error: null,
        };
      }

      // Check if product already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', resolvedUserId)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        // Update quantity
        const { data, error } = await supabase
          .from('cart_items')
          .update({
            quantity: existing.quantity + quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select('*, product:products(*)')
          .single();

        if (!error && isBrowser()) {
          dispatchCartUpdated();
        }

        return { data, error };
      } else {
        // Add new item
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: resolvedUserId,
            product_id: productId,
            quantity,
          })
          .select('*, product:products(*)')
          .single();

        if (!error && isBrowser()) {
          dispatchCartUpdated();
        }

        return { data, error };
      }
    } catch (error) {
      console.error('[CartService] Error adding to cart:', error);
      return { data: null, error };
    }
  },

   /**
    * Get user's cart with products
    */
  async getCart(userId?: string): Promise<{ data: CartItem[] | null; error: any }> {
    try {
      const resolvedUserId = await resolveCartUserId(userId);

      if (!resolvedUserId) {
        const localCart = getStoredLocalCart();

        if (localCart.length === 0) {
          return { data: [], error: null };
        }

        const productIds = [...new Set(localCart.map((item) => item.product_id))];
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('is_active', true);

        if (error) {
          return { data: null, error };
        }

        const productMap = new Map((products || []).map((product) => [product.id, product]));
        const data = localCart
          .map((item) => ({
            id: item.product_id,
            user_id: 'guest',
            product_id: item.product_id,
            quantity: item.quantity,
            added_at: item.added_at,
            product: productMap.get(item.product_id),
          }))
          .filter((item) => item.product);

        return { data, error: null };
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', resolvedUserId)
        .order('added_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('[CartService] Error fetching cart:', error);
      return { data: null, error };
    }
  },

  /**
   * Update cart item quantity
   */
  async updateQuantity(
    cartItemId: string,
    quantity: number,
    userId?: string
  ): Promise<{ data: CartItem | null; error: any }> {
    try {
      if (quantity <= 0) {
        // Remove item if quantity is 0
        const result = await this.removeFromCart(cartItemId, userId);
        return { data: null, error: result.error };
      }

      const resolvedUserId = await resolveCartUserId(userId);

      if (!resolvedUserId) {
        const cart = getStoredLocalCart();
        const item = cart.find((entry) => entry.product_id === cartItemId);

        if (!item) {
          return { data: null, error: null };
        }

        item.quantity = quantity;
        saveStoredLocalCart(cart);

        return {
          data: {
            id: item.product_id,
            user_id: 'guest',
            product_id: item.product_id,
            quantity: item.quantity,
            added_at: item.added_at,
          },
          error: null,
        };
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartItemId)
        .select('*, product:products(*)')
        .single();

      if (!error && isBrowser()) {
        dispatchCartUpdated();
      }

      return { data, error };
    } catch (error) {
      console.error('[CartService] Error updating quantity:', error);
      return { data: null, error };
    }
  },

   /**
    * Remove item from cart
    */
  async removeFromCart(cartItemId: string, userId?: string): Promise<{ error: any }> {
    try {
      const resolvedUserId = await resolveCartUserId(userId);

      if (!resolvedUserId) {
        const nextCart = getStoredLocalCart().filter((item) => item.product_id !== cartItemId);
        saveStoredLocalCart(nextCart);
        return { error: null };
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (!error && isBrowser()) {
        dispatchCartUpdated();
      }

      return { error };
    } catch (error) {
      console.error('[CartService] Error removing from cart:', error);
      return { error };
    }
  },

   /**
    * Clear entire cart
    */
  async clearCart(userId?: string): Promise<{ error: any }> {
    try {
      const resolvedUserId = await resolveCartUserId(userId);

      if (!resolvedUserId) {
        clearStoredLocalCart();
        return { error: null };
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', resolvedUserId);

      if (!error && isBrowser()) {
        dispatchCartUpdated();
      }

      return { error };
    } catch (error) {
      console.error('[CartService] Error clearing cart:', error);
      return { error };
    }
  },

  /**
   * Calculate cart total
   */
  async calculateTotal(userId: string): Promise<{ 
    subtotal: number; 
    itemCount: number;
    error: any 
  }> {
    try {
      const { data: cart } = await this.getCart(userId);
      
      if (!cart || cart.length === 0) {
        return { subtotal: 0, itemCount: 0, error: null };
      }

      const subtotal = cart.reduce((sum, item) => {
        return sum + (item.product?.price_cents || 0) * item.quantity;
      }, 0);

      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

      return { subtotal, itemCount, error: null };
    } catch (error) {
      console.error('[CartService] Error calculating total:', error);
      return { subtotal: 0, itemCount: 0, error };
    }
  },
};

// ============================================================================
// ADDRESS SERVICE
// ============================================================================

export const addressService = {
  /**
   * Save delivery address
   */
  async saveAddress(
    userId: string,
    address: Omit<Address, 'id' | 'user_id'>
  ): Promise<{ data: Address | null; error: any }> {
    try {
      // If setting as default, unset other defaults
      if (address.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          ...address,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('[AddressService] Error saving address:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's addresses
   */
  async getUserAddresses(userId: string): Promise<{ data: Address[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('[AddressService] Error fetching addresses:', error);
      return { data: null, error };
    }
  },

  /**
   * Get default address
   */
  async getDefaultAddress(userId: string): Promise<{ data: Address | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      return { data, error };
    } catch (error) {
      console.error('[AddressService] Error fetching default address:', error);
      return { data: null, error };
    }
  },
};

// ============================================================================
// DELIVERY SERVICE
// ============================================================================

export const deliveryService = {
  /**
   * Get delivery fee for city/area
   */
  async getDeliveryFee(city: string, area?: string): Promise<{ 
    fee: number; 
    estimatedDays: number;
    error: any 
  }> {
    try {
      // Try exact match first (city + area)
      let query = supabase
        .from('delivery_zones')
        .select('*')
        .eq('city', city)
        .eq('is_active', true);

      if (area) {
        query = query.eq('area', area);
      }

      const { data } = await query.maybeSingle();

      if (data) {
        return { 
          fee: data.delivery_fee_cents, 
          estimatedDays: data.estimated_days,
          error: null 
        };
      }

      // Fallback to city-only
      const { data: cityData } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('city', city)
        .eq('area', null)
        .eq('is_active', true)
        .maybeSingle();

      if (cityData) {
        return { 
          fee: cityData.delivery_fee_cents, 
          estimatedDays: cityData.estimated_days,
          error: null 
        };
      }

      // Default fee if no zone found
      return { fee: 500, estimatedDays: 3, error: null }; // $5.00 default
    } catch (error) {
      console.error('[DeliveryService] Error getting delivery fee:', error);
      return { fee: 500, estimatedDays: 3, error };
    }
  },

  /**
   * Get all active delivery zones
   */
  async getDeliveryZones(): Promise<{ data: DeliveryZone[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true)
        .order('city');

      return { data, error };
    } catch (error) {
      console.error('[DeliveryService] Error fetching zones:', error);
      return { data: null, error };
    }
  },
};

// ============================================================================
// BUNDLE SERVICE
// ============================================================================

export const bundleService = {
  /**
   * Get all active bundles with items
   */
  async getBundles(): Promise<{ data: ProductBundle[] | null; error: any }> {
    try {
      const { data: bundles, error } = await supabase
        .from('product_bundles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !bundles) {
        return { data: null, error };
      }

      // Fetch items for each bundle
      const bundlesWithItems = await Promise.all(
        bundles.map(async (bundle) => {
          const { data: items } = await supabase
            .from('bundle_items')
            .select(`
              quantity,
              product:products(*)
            `)
            .eq('bundle_id', bundle.id);

          return {
            ...bundle,
            items: items || [],
          };
        })
      );

      return { data: bundlesWithItems, error: null };
    } catch (error) {
      console.error('[BundleService] Error fetching bundles:', error);
      return { data: null, error };
    }
  },

  /**
   * Calculate bundle price with discount
   */
  calculateBundlePrice(bundle: ProductBundle): { 
    originalPrice: number;
    discountedPrice: number;
    savings: number;
  } {
    const originalPrice = bundle.items?.reduce((sum, item) => {
      return sum + (item.product?.price_cents || 0) * item.quantity;
    }, 0) || 0;

    const discountedPrice = Math.round(
      originalPrice * (1 - bundle.discount_percent / 100)
    );

    const savings = originalPrice - discountedPrice;

    return { originalPrice, discountedPrice, savings };
  },
};

// ============================================================================
// CHECKOUT SERVICE (E-Commerce)
// ============================================================================

export const ecommerceCheckoutService = {
  async createOrderWithItems(input: {
    userId: string;
    items: CheckoutItemInput[];
    addressId: string;
    paymentMethod: 'cod' | 'omt' | 'wish' | 'bank_transfer';
    deliveryFeeCents: number;
    referenceNumber?: string;
    proofImageUrl?: string;
    clientOrderId?: string;
  }): Promise<{ data: Order | null; error: any }> {
    try {
      debugCheckoutLog('RPC request', input);

      const { data, error } = await supabase.rpc('create_order_with_items', {
        p_user_id: input.userId,
        p_items: input.items,
        p_address_id: input.addressId,
        p_payment_method: input.paymentMethod,
        p_reference_number: input.referenceNumber ?? null,
        p_delivery_fee_cents: input.deliveryFeeCents,
        p_proof_image_url: input.proofImageUrl ?? null,
        p_client_order_id: input.clientOrderId ?? null,
      });

      if (error) {
        debugCheckoutLog('RPC error', error);
        return { data: null, error };
      }

      const order = Array.isArray(data) ? data[0] : data;
      debugCheckoutLog('RPC success', order);
      return { data: order ?? null, error: null };
    } catch (error) {
      console.error('[EcommerceCheckout] Error creating order with items:', error);
      return { data: null, error };
    }
  },

  /**
   * Complete checkout - creates order from cart
   */
  async checkout(
    userId: string,
    paymentMethod: 'cod' | 'omt' | 'wish' | 'bank_transfer',
    addressId: string,
    referenceNumber?: string,
    proofImageUrl?: string
  ): Promise<{ data: Order | null; error: any }> {
    try {
      // Get cart items
      const { data: cart, error: cartError } = await cartService.getCart(userId);
      
      if (cartError || !cart || cart.length === 0) {
        return { data: null, error: new Error('Cart is empty') };
      }

      // Get delivery address
      const { data: address } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .single();

      if (!address) {
        return { data: null, error: new Error('Invalid delivery address') };
      }

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => {
        return sum + (item.product?.price_cents || 0) * item.quantity;
      }, 0);

      // Get delivery fee
      const { fee: deliveryFee } = await deliveryService.getDeliveryFee(
        address.city,
        address.area || undefined
      );

      const totalCents = subtotal + deliveryFee;

      // Create order using local payment service
      const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      let orderResult;

      if (paymentMethod === 'cod') {
        // COD checkout
        orderResult = await supabase.rpc('create_cod_order', {
          p_user_id: userId,
          p_items: items,
          p_address_id: addressId,
          p_delivery_fee_cents: deliveryFee,
        });
      } else {
        // Local payment with proof (OMT/Wish/Bank)
        if (!proofImageUrl) {
          return { 
            data: null, 
            error: new Error('Payment proof is required for this payment method') 
          };
        }

        orderResult = await supabase.rpc('create_local_payment_order', {
          p_user_id: userId,
          p_items: items,
          p_payment_method: paymentMethod,
          p_reference_number: referenceNumber,
          p_proof_image_url: proofImageUrl,
          p_address_id: addressId,
          p_delivery_fee_cents: deliveryFee,
        });
      }

      if (orderResult.error) {
        throw orderResult.error;
      }

      // Clear cart after successful order
      await cartService.clearCart(userId);

      return { data: orderResult.data, error: null };
    } catch (error) {
      console.error('[EcommerceCheckout] Error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's orders with delivery status
   */
  async getUserOrders(userId: string): Promise<{ data: Order[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, product:products(*)),
          delivery_address:addresses(*),
          payment_proofs(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('[EcommerceCheckout] Error fetching orders:', error);
      return { data: null, error };
    }
  },
};
