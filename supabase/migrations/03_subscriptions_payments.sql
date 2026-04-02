-- ============================================================
-- 03_SUBSCRIPTIONS_PAYMENTS.sql
-- Lebanon-friendly manual payment system
-- ============================================================

-- ============================================================
-- PAYMENT REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('pro', 'elite')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('whish', 'omt', 'bank')),
    proof_image_url TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at DESC);

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'elite')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    payment_request_id UUID REFERENCES payment_requests(id),
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Payment Requests policies
CREATE POLICY "Users can view their own payment requests"
    ON payment_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment requests"
    ON payment_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment requests"
    ON payment_requests FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

CREATE POLICY "Admins can update payment requests"
    ON payment_requests FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
    ON subscriptions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Trigger for subscription updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to approve payment and create subscription
CREATE OR REPLACE FUNCTION approve_payment_request(
    request_id UUID,
    admin_id UUID,
    notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_plan TEXT;
    v_duration_days INTEGER := 30;
BEGIN
    -- Get payment request details
    SELECT user_id, plan INTO v_user_id, v_plan
    FROM payment_requests
    WHERE id = request_id AND status = 'pending';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Payment request not found or already processed';
    END IF;

    -- Update payment request status
    UPDATE payment_requests
    SET status = 'approved',
        reviewed_by = admin_id,
        reviewed_at = NOW(),
        admin_notes = notes
    WHERE id = request_id;

    -- Upsert subscription
    INSERT INTO subscriptions (user_id, plan, status, expires_at, payment_request_id)
    VALUES (v_user_id, v_plan, 'active', NOW() + INTERVAL '30 days', request_id)
    ON CONFLICT (user_id)
    DO UPDATE SET
        plan = v_plan,
        status = 'active',
        expires_at = NOW() + INTERVAL '30 days',
        payment_request_id = request_id,
        updated_at = NOW();

    -- Update profile plan
    UPDATE profiles
    SET plan = v_plan
    WHERE id = v_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and expire subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS VOID AS $$
BEGIN
    UPDATE subscriptions
    SET status = 'expired'
    WHERE status = 'active' AND expires_at < NOW();

    -- Update profiles back to free plan
    UPDATE profiles
    SET plan = 'free'
    WHERE id IN (
        SELECT user_id FROM subscriptions
        WHERE status = 'expired' AND plan != 'free'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Users can upload their own payment proofs"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'payment-proofs'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own payment proofs"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'payment-proofs'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Admins can view all payment proofs"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'payment-proofs'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );
