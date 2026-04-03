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

// ============================================================================
// CART SERVICE
// ============================================================================

export const cartService = {
  /**
   * Add product to cart (or update quantity if exists)
   */
  async addToCart(
    userId: string,
    productId: string,
    quantity: number = 1
  ): Promise<{ data: CartItem | null; error: any }> {
    try {
      // Check if product already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
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

        return { data, error };
      } else {
        // Add new item
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            product_id: productId,
            quantity,
          })
          .select('*, product:products(*)')
          .single();

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
  async getCart(userId: string): Promise<{ data: CartItem[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', userId)
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
    quantity: number
  ): Promise<{ data: CartItem | null; error: any }> {
    try {
      if (quantity <= 0) {
        // Remove item if quantity is 0
        const result = await this.removeFromCart(cartItemId);
        return { data: null, error: result.error };
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

      return { data, error };
    } catch (error) {
      console.error('[CartService] Error updating quantity:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(cartItemId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      return { error };
    } catch (error) {
      console.error('[CartService] Error removing from cart:', error);
      return { error };
    }
  },

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

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
