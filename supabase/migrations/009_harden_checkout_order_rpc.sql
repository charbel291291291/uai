-- ============================================================================
-- HARDEN CHECKOUT ORDER RPC
-- ============================================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS client_order_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_client_order_id
  ON orders(client_order_id)
  WHERE client_order_id IS NOT NULL;

DROP FUNCTION IF EXISTS create_order_with_items(UUID, JSONB, UUID, TEXT, TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION create_order_with_items(
  p_user_id UUID,
  p_items JSONB,
  p_address_id UUID,
  p_payment_method TEXT DEFAULT 'cod',
  p_reference_number TEXT DEFAULT NULL,
  p_delivery_fee_cents INTEGER DEFAULT 0,
  p_proof_image_url TEXT DEFAULT NULL,
  p_client_order_id UUID DEFAULT NULL
)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_existing_order orders%ROWTYPE;
  v_item JSONB;
  v_product RECORD;
  v_unit_price INTEGER;
  v_quantity INTEGER;
  v_subtotal INTEGER := 0;
  v_items_total INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items are required';
  END IF;

  IF p_payment_method NOT IN ('cod', 'omt', 'wish', 'bank_transfer') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  IF COALESCE(p_delivery_fee_cents, 0) < 0 THEN
    RAISE EXCEPTION 'Invalid delivery fee';
  END IF;

  IF p_client_order_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_client_order_id::TEXT));

    SELECT *
    INTO v_existing_order
    FROM orders
    WHERE client_order_id = p_client_order_id
      AND user_id = auth.uid()
    LIMIT 1;

    IF v_existing_order.id IS NOT NULL THEN
      RETURN NEXT v_existing_order;
      RETURN;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM addresses
    WHERE id = p_address_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Invalid delivery address';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF COALESCE(v_item->>'product_id', '') = '' THEN
      RAISE EXCEPTION 'Invalid product id';
    END IF;

    v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 0);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity';
    END IF;

    SELECT id, price_cents, is_active, stock_quantity
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;

    IF v_product.id IS NULL OR v_product.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Invalid or inactive product';
    END IF;

    IF v_product.stock_quantity IS NOT NULL AND v_quantity > v_product.stock_quantity THEN
      RAISE EXCEPTION 'Out of stock';
    END IF;

    v_unit_price := v_product.price_cents;
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
    delivery_fee_cents,
    client_order_id
  )
  VALUES (
    auth.uid(),
    'pending',
    v_subtotal + COALESCE(p_delivery_fee_cents, 0),
    'USD',
    p_payment_method,
    CASE WHEN p_payment_method = 'cod' THEN 'pending_cod' ELSE 'pending_verification' END,
    (p_payment_method <> 'cod'),
    p_reference_number,
    p_address_id,
    COALESCE(p_delivery_fee_cents, 0),
    p_client_order_id
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;

    SELECT id, price_cents, stock_quantity
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;

    v_unit_price := v_product.price_cents;

    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price_cents,
      total_cents
    )
    VALUES (
      v_order.id,
      v_product.id,
      v_quantity,
      v_unit_price,
      v_unit_price * v_quantity
    );

    v_items_total := v_items_total + (v_unit_price * v_quantity);

    IF v_product.stock_quantity IS NOT NULL THEN
      UPDATE products
      SET stock_quantity = stock_quantity - v_quantity
      WHERE id = v_product.id;
    END IF;
  END LOOP;

  IF v_items_total <> v_subtotal THEN
    RAISE EXCEPTION 'Order total mismatch';
  END IF;

  UPDATE orders
  SET total_cents = v_items_total + COALESCE(p_delivery_fee_cents, 0)
  WHERE id = v_order.id
  RETURNING * INTO v_order;

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
      auth.uid(),
      'pending'
    );
  END IF;

  RETURN NEXT v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION create_order_with_items(UUID, JSONB, UUID, TEXT, TEXT, INTEGER, TEXT, UUID) TO authenticated;
