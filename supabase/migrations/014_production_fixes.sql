-- ============================================================================
-- Migration 014: Production Fixes
-- Run this in the Supabase SQL Editor before deploying the corresponding
-- frontend changes. All functions are SECURITY DEFINER with explicit search_path.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Revenue aggregate — replaces client-side full table scan in AdminDashboard
--    Avoids the 1000-row Supabase JS client default limit.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_order_revenue_cents()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_cents), 0)::bigint FROM orders;
$$;

-- Grant execution to authenticated users (admin UI calls this)
GRANT EXECUTE ON FUNCTION get_order_revenue_cents() TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. Atomic profile view increment — replaces the read-modify-write race
--    condition in ProfileNew.tsx where two simultaneous page loads could both
--    read the same count and each write +1 instead of +2.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET analytics = jsonb_set(
    COALESCE(analytics, '{}'),
    '{views}',
    to_jsonb(COALESCE((analytics->>'views')::int, 0) + 1)
  )
  WHERE id = profile_id;
$$;

-- Allow anonymous visitors to increment view counts
GRANT EXECUTE ON FUNCTION increment_profile_views(uuid) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 3. Analytics summary aggregate — replaces client-side filter loop that
--    silently truncates beyond 1000 events due to Supabase row limit.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_profile_id uuid,
  p_start_date timestamptz
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_events',   COUNT(*),
    'page_views',     COUNT(*) FILTER (WHERE event_type = 'page_view'),
    'profile_views',  COUNT(*) FILTER (WHERE event_type = 'profile_view'),
    'chat_starts',    COUNT(*) FILTER (WHERE event_type = 'chat_started'),
    'cta_clicks',     COUNT(*) FILTER (WHERE event_type = 'cta_click'),
    'nfc_taps',       COUNT(*) FILTER (WHERE event_type = 'nfc_tap')
  )
  FROM analytics_events
  WHERE profile_id = p_profile_id
    AND created_at >= p_start_date;
$$;

GRANT EXECUTE ON FUNCTION get_analytics_summary(uuid, timestamptz) TO authenticated;


-- ----------------------------------------------------------------------------
-- 4. Ensure payment_proofs storage bucket exists with correct name (underscore)
--    If you previously created 'payment-proofs' (hyphen), rename it or ensure
--    the underscore variant exists. Run this once.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: users can upload their own proofs
CREATE POLICY "Users can upload payment proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policy: authenticated users can read proofs (admins view them)
CREATE POLICY "Authenticated users can view payment proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment_proofs');


-- ----------------------------------------------------------------------------
-- 5. Add role column to profiles if not exists (migration 012 dependency)
--    Safe no-op if already applied.
-- ----------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' NOT NULL;

-- Index for fast role lookups in admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role)
  WHERE role != 'user';


-- ----------------------------------------------------------------------------
-- 6. Harden RLS: ensure only DB role grants admin access
--    (complements the admin.ts user_metadata fix)
-- ----------------------------------------------------------------------------
-- Revoke any existing overly-permissive policies on payment_requests if present
-- and re-create with role-based guard.

-- Admin read policy
DROP POLICY IF EXISTS "Admin can view all payment requests" ON payment_requests;
CREATE POLICY "Admin can view all payment requests"
  ON payment_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Users can only read their own payment requests
DROP POLICY IF EXISTS "Users can view own payment requests" ON payment_requests;
CREATE POLICY "Users can view own payment requests"
  ON payment_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- ============================================================================
-- END OF MIGRATION 014
-- ============================================================================
