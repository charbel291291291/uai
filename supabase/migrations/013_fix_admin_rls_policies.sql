-- ============================================================================
-- MIGRATION 013: Fix admin RLS policies — remove hardcoded emails/usernames
-- ============================================================================
-- Previous migration 005 used hardcoded email and username values in RLS
-- policies which is fragile and a security risk. Replace with role-based
-- checks using the profiles.role column added in migration 012.
-- ============================================================================

-- ── payment_requests ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can view all payment requests"  ON payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests"    ON payment_requests;

-- Admins can read all payment requests
CREATE POLICY "Admins can view all payment requests"
  ON payment_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id  = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Admins can approve / reject payment requests
CREATE POLICY "Admins can update payment requests"
  ON payment_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id  = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── payment_proofs ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can manage all payment proofs" ON payment_proofs;

-- Admins have full access to all payment proofs
CREATE POLICY "Admins can manage all payment proofs"
  ON payment_proofs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id  = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── orders (admin view) ───────────────────────────────────────────────────────
-- Ensure admins can read all orders for the order management panel.

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id  = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Admins can update order status
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id  = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── products (admin write) ───────────────────────────────────────────────────
-- Allow admins to insert / update / soft-delete products.

DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id  = auth.uid()
        AND profiles.role = 'admin'
    )
  );
