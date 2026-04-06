-- ============================================================================
-- Migration 015: eyedeaz SaaS — Subscriptions + Events + Leads upgrade
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. subscriptions table (proper — replaces derived subscription from payments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan                text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at          timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz,
  auto_renew          boolean NOT NULL DEFAULT false,
  payment_request_id  uuid REFERENCES payment_requests(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- One active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_active
  ON subscriptions (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions (expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin reads all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Only server/admin can insert/update subscriptions (no client self-upgrade)
CREATE POLICY "Admin manages subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ----------------------------------------------------------------------------
-- 2. Upsert subscription when a payment is approved
--    Called by approve_payment_request RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION upsert_subscription_on_payment(
  p_user_id          uuid,
  p_plan             text,
  p_payment_id       uuid,
  p_duration_days    int DEFAULT 30
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_id uuid;
  v_expires timestamptz := now() + (p_duration_days || ' days')::interval;
BEGIN
  -- Cancel any previous active subscription
  UPDATE subscriptions
  SET status = 'cancelled', updated_at = now()
  WHERE user_id = p_user_id AND status = 'active';

  -- Create new active subscription
  INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at, auto_renew, payment_request_id)
  VALUES (p_user_id, p_plan, 'active', now(), v_expires, false, p_payment_id)
  RETURNING id INTO v_sub_id;

  -- Update profiles.plan for fast reads
  UPDATE profiles SET plan = p_plan, updated_at = now() WHERE id = p_user_id;

  RETURN v_sub_id;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_subscription_on_payment(uuid, text, uuid, int) TO authenticated;


-- ----------------------------------------------------------------------------
-- 3. Expire subscriptions past their expires_at
--    Call this via a pg_cron job: SELECT expire_old_subscriptions();
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH expired AS (
    UPDATE subscriptions
    SET status = 'expired', updated_at = now()
    WHERE status = 'active' AND expires_at < now()
    RETURNING user_id
  )
  UPDATE profiles SET plan = 'free', updated_at = now()
  WHERE id IN (SELECT user_id FROM expired);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


-- ----------------------------------------------------------------------------
-- 4. analytics_events table (structured — replaces jsonb analytics column)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  visitor_id      text,
  session_id      text,
  event_type      text NOT NULL,
  metadata        jsonb DEFAULT '{}',
  source          text,
  referrer        text,
  ip_address      text,
  user_agent      text,
  country         text,
  city            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  event_timestamp timestamptz NOT NULL DEFAULT now()
);

-- Already exists guard (migration 014 may have created this)
-- This is safe — CREATE TABLE IF NOT EXISTS handles it.

CREATE INDEX IF NOT EXISTS idx_analytics_profile_created ON analytics_events (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type      ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor         ON analytics_events (visitor_id);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile owners read own events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admin reads all events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Anyone can insert analytics events (anon visitors)
CREATE POLICY "Anyone can track events"
  ON analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- 5. Leads — add status column for CRM-style tracking
-- ----------------------------------------------------------------------------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'new'
  CHECK (status IN ('new', 'contacted', 'converted', 'lost'));

ALTER TABLE leads ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index for lead inbox queries
CREATE INDEX IF NOT EXISTS idx_leads_profile_status ON leads (profile_id, status);


-- ----------------------------------------------------------------------------
-- 6. admin_stats view — extend with subscription counts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*)::int        FROM products        WHERE is_active = true)          AS total_products,
  (SELECT COUNT(*)::int        FROM orders)                                           AS total_orders,
  (SELECT COALESCE(SUM(total_cents), 0)::bigint FROM orders)                          AS revenue_cents,
  (SELECT COUNT(*)::int        FROM payment_requests WHERE status = 'pending')        AS pending_payments,
  (SELECT COUNT(*)::int        FROM subscriptions   WHERE status = 'active')          AS active_subscriptions,
  (SELECT COUNT(*)::int        FROM subscriptions   WHERE plan = 'pro'  AND status = 'active') AS pro_subscribers,
  (SELECT COUNT(*)::int        FROM subscriptions   WHERE plan = 'elite' AND status = 'active') AS elite_subscribers;

GRANT SELECT ON admin_stats TO authenticated;


-- ----------------------------------------------------------------------------
-- 7. get_profile_analytics_summary — server-side aggregate (fast, no row limit)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_profile_analytics_summary(
  p_profile_id uuid,
  p_days       int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_events',   COUNT(*),
    'profile_views',  COUNT(*) FILTER (WHERE event_type = 'profile_view'),
    'cta_clicks',     COUNT(*) FILTER (WHERE event_type = 'cta_click'),
    'chat_starts',    COUNT(*) FILTER (WHERE event_type = 'chat_started'),
    'nfc_taps',       COUNT(*) FILTER (WHERE event_type = 'nfc_tap'),
    'link_clicks',    COUNT(*) FILTER (WHERE event_type = 'link_click'),
    'unique_visitors', COUNT(DISTINCT visitor_id)
  )
  FROM analytics_events
  WHERE profile_id = p_profile_id
    AND created_at >= now() - (p_days || ' days')::interval;
$$;

GRANT EXECUTE ON FUNCTION get_profile_analytics_summary(uuid, int) TO authenticated;


-- ----------------------------------------------------------------------------
-- 8. Daily timeseries for charts — groups events by day
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_profile_analytics_timeseries(
  p_profile_id uuid,
  p_days       int DEFAULT 30,
  p_event_type text DEFAULT 'profile_view'
)
RETURNS TABLE (day date, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('day', created_at)::date AS day,
    COUNT(*)                            AS count
  FROM analytics_events
  WHERE profile_id   = p_profile_id
    AND event_type   = p_event_type
    AND created_at  >= now() - (p_days || ' days')::interval
  GROUP BY 1
  ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION get_profile_analytics_timeseries(uuid, int, text) TO authenticated;


-- ============================================================================
-- END OF MIGRATION 015
-- ============================================================================
