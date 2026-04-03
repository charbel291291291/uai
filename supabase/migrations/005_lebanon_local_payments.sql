-- ============================================================================
-- LEBANON LOCAL PAYMENT METHODS - DATABASE EXTENSION (ADD-ON ONLY)
-- ============================================================================
-- Extends existing monetization system with local payment methods
-- NO modifications to existing tables structure - only adds new columns/tables
-- ============================================================================

-- ============================================================================
-- 1. EXTEND ORDERS TABLE - Add payment method tracking
-- ============================================================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cod', 'omt', 'wish', 'bank_transfer')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'pending_cod', 'pending_verification', 'paid', 'failed', 'refunded', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_proof_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reference_number TEXT, -- For OMT/Wish/Bank transfer reference
ADD COLUMN IF NOT EXISTS admin_notes TEXT; -- Admin notes for verification

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Update existing rows to have default values (local payments only)
UPDATE orders SET payment_method = 'cod' WHERE payment_method IS NULL AND payment_status = 'pending_cod';

-- ============================================================================
-- 2. PAYMENT METHODS TABLE - Available payment options in Lebanon
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'Cash on Delivery', 'OMT', 'Wish Money', 'Bank Transfer'
  code TEXT NOT NULL UNIQUE, -- 'cod', 'omt', 'wish', 'bank_transfer'
  description TEXT,
  instructions TEXT, -- Payment instructions shown to user
  is_active BOOLEAN DEFAULT true,
  requires_proof BOOLEAN DEFAULT false, -- TRUE for OMT/Wish/Bank transfer
  processing_time TEXT, -- e.g., '1-2 business days'
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Additional config (e.g., phone numbers, account details)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);

-- ============================================================================
-- 3. PAYMENT PROOFS TABLE - MANDATORY proof uploads for local payments
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, -- REQUIRED - cannot be null
  reference_number TEXT, -- Transaction reference number from user
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reviewed_by UUID REFERENCES auth.users(id),
  admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT, -- Why proof was rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_proofs_order_id ON payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_submitted_by ON payment_proofs(submitted_by);

-- ============================================================================
-- 4. PAYMENT REQUESTS TABLE - Subscription payment requests (manual review)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'elite')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'omt', 'wish', 'bank_transfer')),
  proof_image_url TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0), -- in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at DESC);

-- RLS for payment_requests
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Users can create own payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON payment_requests;

-- Users can view their own payment requests
CREATE POLICY "Users can view own payment requests"
  ON payment_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own payment requests
CREATE POLICY "Users can create own payment requests"
  ON payment_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all payment requests (by username or email)
CREATE POLICY "Admins can view all payment requests"
  ON payment_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username IN ('admin', 'eyedeaz')
    )
    OR auth.email() = 'albasma12182@gmail.com'
  );

-- Admins can update payment requests
CREATE POLICY "Admins can update payment requests"
  ON payment_requests FOR UPDATE
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view own payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Users can create own payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Admins can manage all payment proofs" ON payment_proofs;

-- Payment Methods: Anyone can view active methods
CREATE POLICY "Anyone can view active payment methods"
  ON payment_methods FOR SELECT
  USING (is_active = true);

-- Payment Proofs: Users can view their own proofs
CREATE POLICY "Users can view own payment proofs"
  ON payment_proofs FOR SELECT
  USING (auth.uid() = submitted_by);

CREATE POLICY "Users can create own payment proofs"
  ON payment_proofs FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- Admins can view all payment proofs (using service role or admin check)
CREATE POLICY "Admins can manage all payment proofs"
  ON payment_proofs FOR ALL
  USING (
    auth.jwt()->>'role' = 'service_role' 
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- SEED DATA - Lebanon Payment Methods
-- ============================================================================

-- Delete existing payment methods first (for idempotent migrations)
DELETE FROM payment_methods WHERE code IN ('cod', 'omt', 'wish', 'bank_transfer');

-- Insert payment methods
INSERT INTO payment_methods (name, code, description, instructions, requires_proof, processing_time, sort_order, metadata) VALUES
('Cash on Delivery', 'cod', 'Pay when you receive your order', 'Pay cash upon delivery. No online payment required.', false, 'Upon delivery', 1, '{"available_cities": ["Beirut", "Mount Lebanon", "Tripoli", "Sidon", "Tyre"]}'),
('OMT Payment', 'omt', 'Pay via OMT money transfer', 
 E'Send payment to:\n• Name: [Your Business Name]\n• Phone: +961 XX XXX XXX\n\nAfter sending:\n1. Take photo of receipt\n2. Upload below\n3. Include reference number', 
 true, '1-2 hours', 2, 
 '{"phone": "+96170123456", "recipient_name": "UAi Store"}'),
('Wish Money', 'wish', 'Pay via Wish Money app', 
 E'Send payment to:\n• Account: [Your Wish Account]\n• Number: +961 XX XXX XXX\n\nAfter sending:\n1. Screenshot the transaction\n2. Upload below\n3. Include reference number', 
 true, '1-2 hours', 3, 
 '{"account": "uaistore@wish.com", "phone": "+96170123456"}'),
('Bank Transfer', 'bank_transfer', 'Direct bank transfer', 
 E'Transfer to:\n• Bank: [Bank Name]\n• Account: [Account Number]\n• IBAN: [IBAN]\n\nAfter transfer:\n1. Upload receipt/screenshot\n2. Include reference number', 
 true, '1-2 business days', 4, 
 '{"bank_name": "Bank of Beirut", "account_number": "XXXX-XXXX-XXXX", "iban": "LBXX XXXX XXXX XXXX XXXX XXXX XXXX XXX"}');

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN orders.payment_method IS 'Payment method used: cod, omt, wish, bank_transfer';
COMMENT ON COLUMN orders.payment_status IS 'Payment status including local payment states';
COMMENT ON COLUMN orders.payment_proof_required IS 'Whether payment proof upload is mandatory';
COMMENT ON COLUMN orders.reference_number IS 'Transaction reference for local payments';
COMMENT ON TABLE payment_methods IS 'Available payment methods in Lebanon';
COMMENT ON TABLE payment_proofs IS 'Mandatory payment proof uploads for local payment methods';
