// ============================================================================
// ADMIN - Approve/Reject Payment Proofs
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
    const { proofId, action, adminNotes, rejectionReason } = await request.json();

    // Validate required fields
    if (!proofId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "approve" or "reject"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For rejection, reason is mandatory
    if (action === 'reject' && !rejectionReason) {
      return new Response(
        JSON.stringify({ error: 'Rejection reason is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get proof details
    const { data: proof, error: proofError } = await supabase
      .from('payment_proofs')
      .select('*, orders(user_id, total_cents)')
      .eq('id', proofId)
      .single();

    if (proofError || !proof) {
      return new Response(
        JSON.stringify({ error: 'Payment proof not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = proof.orders.user_id;
    const orderId = proof.order_id;

    // Update proof status
    const { error: updateProofError } = await supabase
      .from('payment_proofs')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_reviewed_by: null, // In production, get admin user ID from auth
        admin_reviewed_at: new Date().toISOString(),
        rejection_reason: action === 'reject' ? rejectionReason : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proofId);

    if (updateProofError) {
      throw updateProofError;
    }

    // Update order status based on action
    if (action === 'approve') {
      // Mark order as paid
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          paid_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateOrderError) {
        throw updateOrderError;
      }

      // Record payment
      await supabase.from('payments').insert({
        user_id: userId,
        order_id: orderId,
        amount_cents: proof.orders.total_cents,
        currency: 'USD',
        status: 'succeeded',
        stripe_payment_intent_id: `local_${proofId}`, // Local payment reference
        payment_method: proof.payment_method || 'manual',
        paid_at: new Date().toISOString(),
      });
    } else {
      // Reject - mark order as failed
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'failed',
          admin_notes: adminNotes || `Rejected: ${rejectionReason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateOrderError) {
        throw updateOrderError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: action === 'approve' 
          ? 'Payment approved and order marked as paid'
          : 'Payment rejected',
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
    console.error('[Admin Payment Review] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process payment review' }),
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
