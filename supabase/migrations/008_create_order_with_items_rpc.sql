-- ============================================================================
-- CREATE ORDER WITH ITEMS RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION create_order_with_items(
  p_user_id UUID,
  p_items JSONB,
  p_address_id UUID,
  p_payment_method TEXT DEFAULT 'cod',
  p_reference_number TEXT DEFAULT NULL,
  p_delivery_fee_cents INTEGER DEFAULT 0,
  p_proof_image_url TEXT DEFAULT NULL
)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item JSONB;
  v_product RECORD;
  v_unit_price INTEGER;
  v_quantity INTEGER;
  v_subtotal INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM addresses
    WHERE id = p_address_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Invalid delivery address';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 0);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity';
    END IF;

    SELECT id, price_cents, is_active
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID;

    IF v_product.id IS NULL OR v_product.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Invalid or inactive product';
    END IF;

    v_unit_price := COALESCE(NULLIF((v_item->>'price')::INTEGER, 0), v_product.price_cents);
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  INSERT INTO orders (
    user_id,
    status,
    total_cents,
    currency,
    payment_method,
    payment_status,
    payment_proof_required,
    reference_number,
    delivery_address_id,
    delivery_fee_cents
  )
  VALUES (
    p_user_id,
    'pending',
    v_subtotal + COALESCE(p_delivery_fee_cents, 0),
    'USD',
    p_payment_method,
    CASE WHEN p_payment_method = 'cod' THEN 'pending_cod' ELSE 'pending_verification' END,
    (p_payment_method <> 'cod'),
    p_reference_number,
    p_address_id,
    COALESCE(p_delivery_fee_cents, 0)
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;
    SELECT price_cents INTO v_unit_price FROM products WHERE id = (v_item->>'product_id')::UUID;
    v_unit_price := COALESCE(NULLIF((v_item->>'price')::INTEGER, 0), v_unit_price);

    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price_cents,
      total_cents
    )
    VALUES (
      v_order.id,
      (v_item->>'product_id')::UUID,
      v_quantity,
      v_unit_price,
      v_unit_price * v_quantity
    );
  END LOOP;

  IF p_payment_method <> 'cod' THEN
    IF p_proof_image_url IS NULL OR p_proof_image_url = '' THEN
      RAISE EXCEPTION 'Payment proof is required for this payment method';
    END IF;

    INSERT INTO payment_proofs (
      order_id,
      image_url,
      reference_number,
      submitted_by,
      status
    )
    VALUES (
      v_order.id,
      p_proof_image_url,
      p_reference_number,
      p_user_id,
      'pending'
    );
  END IF;

  RETURN NEXT v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION create_order_with_items(UUID, JSONB, UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
