// ============================================================================
// LOCAL PAYMENT CHECKOUT (OMT/Wish/Bank Transfer) - REQUIRES PROOF UPLOAD
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
    const { 
      userId, 
      items, 
      paymentMethod, // 'omt', 'wish', 'bank_transfer'
      referenceNumber,
      proofImageUrl // MANDATORY - cannot be null
    } = await request.json();

    // Validate required fields
    if (!userId || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL VALIDATION: Proof image is MANDATORY for local payments
    if (!proofImageUrl || proofImageUrl.trim() === '') {
      return new Response(
        JSON.stringify({ 
          error: 'Payment proof image is REQUIRED. Cannot create order without uploading proof.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!referenceNumber || referenceNumber.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Reference number is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate payment method
    const validMethods = ['omt', 'wish', 'bank_transfer'];
    if (!validMethods.includes(paymentMethod)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment method' }),
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
        payment_method: paymentMethod,
        payment_status: 'pending_verification',
        payment_proof_required: true,
        reference_number: referenceNumber,
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
      // Rollback order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    // CRITICAL: Create payment proof record (MANDATORY)
    const { error: proofError } = await supabase.from('payment_proofs').insert({
      order_id: order.id,
      image_url: proofImageUrl, // REQUIRED - NOT NULL constraint in DB
      reference_number: referenceNumber,
      submitted_by: userId,
      status: 'pending',
    });

    if (proofError) {
      // Rollback everything if proof creation fails
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save payment proof. Order cancelled.',
          details: proofError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: order.id,
        message: 'Order created successfully. Your payment will be verified within 1-2 hours.',
        paymentStatus: 'pending_verification'
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
    console.error('[Local Payment Checkout] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create local payment order' }),
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
