-- ============================================================================
-- FINALIZE CHECKOUT FOR PRODUCTION
-- ============================================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS client_order_id UUID;

ALTER TABLE orders
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE orders
ALTER COLUMN payment_status SET DEFAULT 'unpaid';

DROP INDEX IF EXISTS idx_orders_client_order_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_client_order_id
  ON orders(client_order_id)
  WHERE client_order_id IS NOT NULL;

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN ('unpaid', 'pending', 'pending_cod', 'pending_verification', 'paid', 'failed', 'refunded', 'cancelled'));

CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_type ON order_events(event_type);

DROP FUNCTION IF EXISTS create_order_with_items(UUID, JSONB, UUID, TEXT, TEXT, INTEGER, TEXT, UUID);

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
  v_quantity INTEGER;
  v_items_total INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_items IS NULL
    OR jsonb_typeof(p_items) <> 'array'
    OR jsonb_array_length(p_items) = 0
    OR p_address_id IS NULL
    OR COALESCE(p_delivery_fee_cents, 0) < 0
    OR p_payment_method NOT IN ('cod', 'omt', 'wish', 'bank_transfer') THEN
    RAISE EXCEPTION 'Invalid order';
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
    RAISE EXCEPTION 'Invalid order';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF COALESCE(v_item->>'product_id', '') = '' THEN
      RAISE EXCEPTION 'Invalid order';
    END IF;

    v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 0);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid order';
    END IF;

    SELECT id, price_cents, is_active, stock_quantity
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;

    IF v_product.id IS NULL OR v_product.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Invalid order';
    END IF;

    IF v_product.stock_quantity IS NOT NULL AND v_product.stock_quantity < v_quantity THEN
      RAISE EXCEPTION 'Out of stock';
    END IF;
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
    payment_intent_id,
    client_order_id
  )
  VALUES (
    auth.uid(),
    'pending',
    0,
    'USD',
    p_payment_method,
    'unpaid',
    (p_payment_method <> 'cod'),
    p_reference_number,
    p_address_id,
    COALESCE(p_delivery_fee_cents, 0),
    NULL,
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
      v_product.price_cents,
      v_product.price_cents * v_quantity
    );

    IF v_product.stock_quantity IS NOT NULL THEN
      UPDATE products
      SET stock_quantity = stock_quantity - v_quantity
      WHERE id = v_product.id
        AND stock_quantity >= v_quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Out of stock';
      END IF;
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(total_cents), 0)
  INTO v_items_total
  FROM order_items
  WHERE order_id = v_order.id;

  UPDATE orders
  SET total_cents = v_items_total + COALESCE(p_delivery_fee_cents, 0)
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  INSERT INTO order_events (order_id, event_type)
  VALUES (v_order.id, 'created');

  IF p_payment_method <> 'cod' THEN
    IF p_proof_image_url IS NULL OR p_proof_image_url = '' THEN
      RAISE EXCEPTION 'Invalid order';
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
