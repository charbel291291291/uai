-- ============================================================================
-- MONETIZATION SYSTEM - DATABASE SCHEMA (ADD-ON ONLY)
-- ============================================================================
-- This script creates NEW tables only - NO modifications to existing tables
-- All tables are linked to existing users via foreign keys
-- ============================================================================

-- ============================================================================
-- 1. PRODUCTS TABLE
-- Physical and digital products for sale
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('physical', 'digital')),
  category TEXT, -- e.g., 'nfc', 'accessory', 'digital'
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER, -- NULL = unlimited, 0 = out of stock
  metadata JSONB DEFAULT '{}', -- Flexible additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============================================================================
-- 2. ORDERS TABLE
-- Main order record (one-time purchases)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  shipping_address JSONB, -- For physical products
  billing_address JSONB,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================================================
-- 3. ORDER ITEMS TABLE
-- Individual items within an order
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
  total_cents INTEGER NOT NULL CHECK (total_cents > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- 4. SUBSCRIPTION PLANS TABLE
-- Define subscription tiers (Free, Pro, Premium)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'Free', 'Pro', 'Premium'
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0, -- 0 for free tier
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('week', 'month', 'year')),
  features JSONB DEFAULT '[]', -- Array of feature strings
  limits JSONB DEFAULT '{}', -- Usage limits (e.g., {max_profiles: 1})
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0, -- Display order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- ============================================================================
-- 5. SUBSCRIPTIONS TABLE
-- User's active/past subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active subscription per user
  CONSTRAINT unique_active_subscription UNIQUE (user_id, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- 6. PAYMENTS TABLE
-- Track all payment transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- NULL for subscription payments
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL, -- NULL for one-time purchases
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method TEXT, -- 'card', 'cod', 'omt', 'wish', 'bank_transfer'
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);

-- ============================================================================
-- 7. WEBHOOK EVENTS TABLE (For debugging/audit - optional for local payments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- e.g., 'payment_verified', 'order_completed'
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Products: Anyone can view active products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can view items from their orders
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Subscription Plans: Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Payments: Users can only see their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Webhook Events: Only service role can access (admin only)
CREATE POLICY "Service role can manage webhook events"
  ON webhook_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- SEED DATA - Sample Products & Plans
-- ============================================================================

-- Insert sample NFC products
INSERT INTO products (name, description, price_cents, type, category, image_url, stock_quantity) VALUES
('NFC Smart Card', 'Premium NFC-enabled business card with custom branding', 2999, 'physical', 'nfc', '/images/nfc-card.webp', 100),
('NFC Keychain', 'Compact NFC keychain for easy sharing', 1999, 'physical', 'nfc', '/images/nfc-keychain.webp', 150),
('NFC Bracelet', 'Stylish NFC bracelet for networking events', 3499, 'physical', 'nfc', '/images/nfc-bracelet.webp', 75),
('NFC Sticker Pack', 'Pack of 5 NFC stickers for versatile use', 1499, 'physical', 'nfc', '/images/nfc-sticker.webp', 200);

-- Insert subscription plans
INSERT INTO subscription_plans (name, description, price_cents, interval, features, limits, sort_order) VALUES
('Free', 'Basic features to get started', 0, 'month', 
  '["1 AI Twin Profile", "Basic Analytics", "Standard Support"]',
  '{"max_profiles": 1, "analytics_days": 7}',
  1),
('Pro', 'Perfect for professionals', 999, 'month',
  '["5 AI Twin Profiles", "Advanced Analytics", "Priority Support", "Custom Branding", "API Access"]',
  '{"max_profiles": 5, "analytics_days": 90, "api_calls_per_month": 10000}',
  2),
('Premium', 'Ultimate power for teams', 2999, 'month',
  '["Unlimited AI Twin Profiles", "Real-time Analytics", "24/7 Dedicated Support", "White-label Solution", "Unlimited API Access", "Team Management"]',
  '{"max_profiles": -1, "analytics_days": 365, "api_calls_per_month": -1}',
  3);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE products IS 'Physical and digital products available for purchase';
COMMENT ON TABLE orders IS 'One-time purchase orders';
COMMENT ON TABLE order_items IS 'Individual items within an order';
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers';
COMMENT ON TABLE subscriptions IS 'User subscription records';
COMMENT ON TABLE payments IS 'All payment transactions (products + subscriptions)';
COMMENT ON TABLE webhook_events IS 'Payment event log for auditing';
