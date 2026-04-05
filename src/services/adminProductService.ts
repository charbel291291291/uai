import { supabase } from '../supabase';
import type { Product } from './monetizationService';

export interface AdminProductPayload {
  name: string;
  sku: string;
  price_cents: number;
  stock_quantity: number;
  description?: string | null;
  image_url?: string | null;
}

export const adminProductService = {
  async getProducts(): Promise<{ data: Product[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('[AdminProductService] Error fetching products:', error);
      return { data: null, error };
    }
  },

  async getProductBySku(sku: string): Promise<{ data: Product | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .maybeSingle();

      return { data, error };
    } catch (error) {
      console.error('[AdminProductService] Error fetching product by SKU:', error);
      return { data: null, error };
    }
  },

  async createProduct(payload: AdminProductPayload): Promise<{ data: Product | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...payload,
          currency: 'USD',
          type: 'physical',
          is_active: true,
        })
        .select('*')
        .single();

      return { data, error };
    } catch (error) {
      console.error('[AdminProductService] Error creating product:', error);
      return { data: null, error };
    }
  },

  async updateProduct(
    productId: string,
    payload: Omit<AdminProductPayload, 'sku'>,
  ): Promise<{ data: Product | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId)
        .select('*')
        .single();

      return { data, error };
    } catch (error) {
      console.error('[AdminProductService] Error updating product:', error);
      return { data: null, error };
    }
  },

  async softDeleteProduct(productId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      return { error };
    } catch (error) {
      console.error('[AdminProductService] Error archiving product:', error);
      return { error };
    }
  },
};
