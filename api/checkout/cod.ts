// ============================================================================
// CASH ON DELIVERY CHECKOUT - Create COD Order
// ============================================================================

export const config = {
  runtime: 'edge',
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { userId, items, shippingAddress } = await request.json();

    // Validate required fields
    if (!userId || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate total
    let totalCents = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .single();

      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product ${item.product_id} not found` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
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
        payment_method: 'cod',
        payment_status: 'pending_cod',
        payment_proof_required: false,
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Create order items
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItems.map((item) => ({
        order_id: order.id,
        ...item,
      }))
    );

    if (itemsError) {
      throw itemsError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: order.id,
        message: 'Order created successfully. Pay cash upon delivery.'
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error: any) {
    console.error('[COD Checkout] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create COD order' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
}
