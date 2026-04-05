-- ============================================================================
-- RENAME CHECKOUT RPCS TO UNIQUE NAMES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'create_order_with_items'
      AND pg_get_function_identity_arguments(oid) =
        'p_user_id uuid, p_items jsonb, p_address_id uuid, p_payment_method text, p_reference_number text, p_delivery_fee_cents integer, p_proof_image_url text, p_client_order_id uuid'
  ) THEN
    EXECUTE '
      ALTER FUNCTION create_order_with_items(uuid, jsonb, uuid, text, text, integer, text, uuid)
      RENAME TO create_order_full
    ';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'create_order_with_items'
      AND pg_get_function_identity_arguments(oid) =
        'p_user_id uuid, p_items jsonb, p_address_id uuid, p_payment_method text, p_reference_number text, p_delivery_fee_cents integer, p_proof_image_url text'
  ) THEN
    EXECUTE '
      ALTER FUNCTION create_order_with_items(uuid, jsonb, uuid, text, text, integer, text)
      RENAME TO create_order_simple
    ';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION create_order_full(UUID, JSONB, UUID, TEXT, TEXT, INTEGER, TEXT, UUID) TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'create_order_simple'
      AND pg_get_function_identity_arguments(oid) =
        'p_user_id uuid, p_items jsonb, p_address_id uuid, p_payment_method text, p_reference_number text, p_delivery_fee_cents integer, p_proof_image_url text'
  ) THEN
    EXECUTE '
      GRANT EXECUTE ON FUNCTION create_order_simple(UUID, JSONB, UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated
    ';
  END IF;
END $$;
