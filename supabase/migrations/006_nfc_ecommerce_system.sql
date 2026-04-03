-- ============================================================================
-- NFC E-COMMERCE SYSTEM - COMPLETE SHOPPING FLOW (ADD-ON ONLY)
-- ============================================================================
-- Extends existing monetization system with full e-commerce functionality
-- NO modifications to existing tables - only adds new features
-- ============================================================================

-- ============================================================================
-- 1. EXTEND PRODUCTS TABLE - Add NFC-specific fields
-- ============================================================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_cents INTEGER, -- Cost price for profit calculation
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE, -- Stock Keeping Unit
ADD COLUMN IF NOT EXISTS weight_grams INTEGER, -- For shipping calculations
ADD COLUMN IF NOT EXISTS dimensions JSONB, -- {length, width, height}
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Search tags
ADD COLUMN IF NOT EXISTS bundle_discount_percent INTEGER DEFAULT 0; -- Discount for bundles

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- ============================================================================
-- 1b. NFC ORDERS TABLE - Legacy NFC order tracking (for backward compatibility)
-- ============================================================================
CREATE TABLE IF NOT EXISTS nfc_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('card', 'keychain', 'bracelet', 'sticker')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  shipping_address JSONB NOT NULL, -- {fullName, street, city, state, zipCode, country, phone}
  total_amount INTEGER NOT NULL, -- in cents
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  carrier TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nfc_orders_user_id ON nfc_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_status ON nfc_orders(status);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_created_at ON nfc_orders(created_at DESC);

-- RLS Policies for nfc_orders
ALTER TABLE nfc_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view own orders" ON nfc_orders;
DROP POLICY IF EXISTS "Users can create own orders" ON nfc_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON nfc_orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON nfc_orders;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON nfc_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create own orders"
  ON nfc_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON nfc_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username IN ('admin', 'eyedeaz')
    )
    OR auth.email() = 'albasma12182@gmail.com'
  );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
  ON nfc_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username IN ('admin', 'eyedeaz')
    )
    OR auth.email() = 'albasma12182@gmail.com'
  );

-- ============================================================================
-- 2. CART ITEMS TABLE - User shopping carts
-- ============================================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One product per user in cart (prevent duplicates)
  CONSTRAINT unique_user_product_cart UNIQUE (user_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- ============================================================================
-- 3. ADDRESSES TABLE - Customer delivery addresses
-- ============================================================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL, -- REQUIRED for Lebanon
  city TEXT NOT NULL, -- Beirut, Tripoli, Sidon, etc.
  area TEXT, -- Specific area/neighborhood
  address_details TEXT, -- Building, floor, landmark
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_phone ON addresses(phone);

-- ============================================================================
-- 4. EXTEND ORDERS TABLE - Add delivery tracking
-- ============================================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
ADD COLUMN IF NOT EXISTS delivery_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delivery_fee_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_assigned_to UUID REFERENCES auth.users(id); -- Admin handling this order

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address ON orders(delivery_address_id);

-- ============================================================================
-- 5. ORDER STATUS HISTORY - Track all status changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id), -- Admin who changed it
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- ============================================================================
-- 6. DELIVERY ZONES - Lebanon-specific delivery fees by area
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL, -- Beirut, Mount Lebanon, etc.
  area TEXT, -- Specific neighborhoods
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
  estimated_days INTEGER DEFAULT 2, -- Estimated delivery time
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_zones_city ON delivery_zones(city);

-- ============================================================================
-- 7. PRODUCT BUNDLES - Pre-defined bundles with discounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Starter Pack", "Pro Bundle"
  description TEXT,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(bundle_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle_id ON bundle_items(bundle_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can add to cart" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can delete from own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can create addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can view own order history" ON order_status_history;
DROP POLICY IF EXISTS "Anyone can view delivery zones" ON delivery_zones;
DROP POLICY IF EXISTS "Anyone can view active bundles" ON product_bundles;
DROP POLICY IF EXISTS "Anyone can view bundle items" ON bundle_items;

-- Cart Items: Users can only see/manage their own cart
CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Addresses: Users manage their own addresses
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

-- Order Status History: Users can view history of their orders
CREATE POLICY "Users can view own order history"
  ON order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_status_history.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Delivery Zones: Anyone can view (for checkout calculation)
CREATE POLICY "Anyone can view delivery zones"
  ON delivery_zones FOR SELECT
  USING (is_active = true);

-- Product Bundles: Anyone can view active bundles
CREATE POLICY "Anyone can view active bundles"
  ON product_bundles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view bundle items"
  ON bundle_items FOR SELECT
  USING (true);

-- ============================================================================
-- SEED DATA - NFC Products with Pricing Strategy
-- ============================================================================

-- Delete existing seed data first (for idempotent migrations)
DELETE FROM bundle_items WHERE bundle_id IN (SELECT id FROM product_bundles WHERE name IN ('Starter Pack', 'Complete NFC Kit', 'Business Trio'));
DELETE FROM product_bundles WHERE name IN ('Starter Pack', 'Complete NFC Kit', 'Business Trio');
DELETE FROM delivery_zones WHERE city IN ('Beirut', 'Mount Lebanon', 'Tripoli', 'Sidon', 'Tyre', 'Bekaa', 'North Lebanon', 'South Lebanon');
DELETE FROM products WHERE sku IN ('NFC-CARD-001', 'NFC-KEY-001', 'NFC-BRAC-001', 'NFC-STICK-005');

-- Insert NFC products with realistic Lebanon pricing
-- Pricing strategy: 50% profit margin, Lebanon-market friendly
INSERT INTO products (name, description, price_cents, cost_cents, type, category, image_url, stock_quantity, sku, weight_grams, tags, bundle_discount_percent) VALUES
-- NFC Card: $12.99 (Cost: ~$6, Profit: 54%)
('NFC Smart Card', 'Premium PVC NFC card with custom branding. Perfect for professional networking.', 1299, 600, 'physical', 'nfc', '/images/nfc-card.webp', 100, 'NFC-CARD-001', 10, 
 ARRAY['business', 'networking', 'professional', 'card'], 10),
-- NFC Keychain: $14.99 (Cost: ~$7, Profit: 53%)
('NFC Keychain', 'Compact and durable NFC keychain. Easy to carry, always accessible.', 1499, 700, 'physical', 'nfc', '/images/nfc-keychain.webp', 150, 'NFC-KEY-001', 15,
 ARRAY['keychain', 'portable', 'durable', 'accessory'], 10),
-- NFC Bracelet: $22.99 (Cost: ~$10, Profit: 56%)
('NFC Bracelet', 'Stylish silicone NFC bracelet. Perfect for events and casual networking.', 2299, 1000, 'physical', 'nfc', '/images/nfc-bracelet.webp', 75, 'NFC-BRAC-001', 25,
 ARRAY['bracelet', 'wearable', 'events', 'stylish'], 15),
-- NFC Sticker Pack: $9.99 (Cost: ~$4, Profit: 60%)
('NFC Sticker Pack (5pcs)', 'Pack of 5 adhesive NFC stickers. Versatile and affordable solution.', 999, 400, 'physical', 'nfc', '/images/nfc-sticker.webp', 200, 'NFC-STICK-005', 50,
 ARRAY['sticker', 'pack', 'affordable', 'versatile'], 20);

-- ============================================================================
-- SEED DATA - Delivery Zones (Lebanon)
-- ============================================================================

INSERT INTO delivery_zones (city, area, delivery_fee_cents, estimated_days) VALUES
('Beirut', NULL, 300, 1), -- $3.00, 1 day
('Mount Lebanon', NULL, 400, 2), -- $4.00, 2 days
('Tripoli', NULL, 500, 2), -- $5.00, 2 days
('Sidon', NULL, 500, 2), -- $5.00, 2 days
('Tyre', NULL, 600, 3), -- $6.00, 3 days
('Bekaa', NULL, 600, 3), -- $6.00, 3 days
('North Lebanon', NULL, 600, 3), -- $6.00, 3 days
('South Lebanon', NULL, 700, 3); -- $7.00, 3 days

-- ============================================================================
-- SEED DATA - Product Bundles
-- ============================================================================

-- Starter Bundle: Card + Stickers (15% off)
INSERT INTO product_bundles (name, description, discount_percent) VALUES
('Starter Pack', 'Perfect for beginners: NFC Card + Sticker Pack', 15);

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT 
  (SELECT id FROM product_bundles WHERE name = 'Starter Pack'),
  id,
  CASE WHEN name = 'NFC Smart Card' THEN 1 ELSE 5 END
FROM products
WHERE name IN ('NFC Smart Card', 'NFC Sticker Pack (5pcs)');

-- Pro Bundle: All 4 items (20% off)
INSERT INTO product_bundles (name, description, discount_percent) VALUES
('Complete NFC Kit', 'Everything you need: Card + Keychain + Bracelet + Stickers', 20);

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT 
  (SELECT id FROM product_bundles WHERE name = 'Complete NFC Kit'),
  id,
  CASE 
    WHEN name = 'NFC Sticker Pack (5pcs)' THEN 5
    ELSE 1
  END
FROM products
WHERE name IN ('NFC Smart Card', 'NFC Keychain', 'NFC Bracelet', 'NFC Sticker Pack (5pcs)');

-- Business Bundle: 3 Cards (10% off)
INSERT INTO product_bundles (name, description, discount_percent) VALUES
('Business Trio', '3 NFC Cards for your team', 10);

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT 
  (SELECT id FROM product_bundles WHERE name = 'Business Trio'),
  id,
  3
FROM products
WHERE name = 'NFC Smart Card';

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE cart_items IS 'User shopping cart items';
COMMENT ON TABLE addresses IS 'Customer delivery addresses';
COMMENT ON TABLE order_status_history IS 'Audit trail for order status changes';
COMMENT ON TABLE delivery_zones IS 'Lebanon delivery zones with fees';
COMMENT ON TABLE product_bundles IS 'Pre-defined product bundles with discounts';
COMMENT ON TABLE bundle_items IS 'Items included in bundles';

COMMENT ON COLUMN products.cost_cents IS 'Cost price for profit margin calculation';
COMMENT ON COLUMN products.sku IS 'Unique stock keeping unit';
COMMENT ON COLUMN orders.delivery_status IS 'Delivery tracking status';
COMMENT ON COLUMN orders.delivery_fee_cents IS 'Shipping fee based on location';
