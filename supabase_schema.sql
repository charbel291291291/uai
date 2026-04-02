-- ============================================================
-- UAi - Complete Supabase Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- Main user profile data
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    about_me TEXT,

    -- Profile Configuration
    mode TEXT DEFAULT 'ai' CHECK (mode IN ('ai', 'landing', 'sales')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
    theme_color TEXT DEFAULT '#00C6FF',
    tone TEXT CHECK (tone IN ('professional', 'friendly', 'persuasive', 'casual', 'energetic')),
    goal TEXT CHECK (goal IN ('get-clients', 'book-calls', 'sell-service', 'build-network', 'share-knowledge')),

    -- AI Configuration
    ai_persona TEXT,
    qa_pairs JSONB DEFAULT '[]'::jsonb,

    -- Services & Testimonials (stored as JSON arrays)
    services JSONB DEFAULT '[]'::jsonb,
    testimonials JSONB DEFAULT '[]'::jsonb,
    links JSONB DEFAULT '[]'::jsonb,

    -- Media
    featured_video_url TEXT,
    avatar_source TEXT CHECK (avatar_source IN ('upload', 'url', 'initials')),
    tags JSONB DEFAULT '[]'::jsonb,

    -- Contact Info
    whatsapp TEXT,
    phone TEXT,

    -- Analytics
    analytics JSONB DEFAULT '{"views": 0, "chats": 0, "messages": 0, "leads": 0, "ctaClicks": 0}'::jsonb,

    -- Settings
    is_private BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_mode ON profiles(mode);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- ============================================================
-- LIKES TABLE
-- User favorites/likes system
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_profile_id ON likes(profile_id);

-- ============================================================
-- MESSAGES TABLE
-- Contact messages sent to profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_name TEXT NOT NULL,
    from_email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_profile_id ON messages(profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================================
-- LEADS TABLE
-- Captured leads from profile interactions
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT NOT NULL,
    message TEXT,
    source TEXT DEFAULT 'profile', -- 'profile', 'chat', 'service', etc.
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_profile_id ON leads(profile_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ============================================================
-- NFC ORDERS TABLE
-- NFC product orders
-- ============================================================
CREATE TABLE IF NOT EXISTS nfc_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type TEXT NOT NULL CHECK (product_type IN ('card', 'keychain', 'bracelet', 'sticker')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfc_orders_user_id ON nfc_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_status ON nfc_orders(status);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_created_at ON nfc_orders(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_orders ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (NOT is_private OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = id);

-- Likes policies
CREATE POLICY "Users can view their own likes"
    ON likes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create likes"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Profile owners can view their messages"
    ON messages FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can send messages"
    ON messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Profile owners can delete their messages"
    ON messages FOR DELETE
    USING (auth.uid() = profile_id);

-- Leads policies
CREATE POLICY "Profile owners can view their leads"
    ON leads FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can create leads"
    ON leads FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Profile owners can update their leads"
    ON leads FOR UPDATE
    USING (auth.uid() = profile_id);

CREATE POLICY "Profile owners can delete their leads"
    ON leads FOR DELETE
    USING (auth.uid() = profile_id);

-- NFC Orders policies
CREATE POLICY "Users can view their own orders"
    ON nfc_orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
    ON nfc_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending orders"
    ON nfc_orders FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nfc_orders_updated_at
    BEFORE UPDATE ON nfc_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment analytics
CREATE OR REPLACE FUNCTION increment_profile_analytics(
    profile_uuid UUID,
    field TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET analytics = jsonb_set(
        analytics,
        ARRAY[field],
        COALESCE(analytics->field, '0')::int + 1
    )
    WHERE id = profile_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SUBSCRIPTION SYSTEM (Lebanon-Friendly Manual Payments)
-- ============================================================

-- Payment Requests Table
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

-- Subscriptions Table
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

-- RLS for Payment Requests
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

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

-- RLS for Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
    ON subscriptions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

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

-- ============================================================
-- SAMPLE DATA (Optional - for development)
-- ============================================================

-- Note: Sample data should be inserted after user authentication
-- Example:
-- INSERT INTO profiles (id, username, display_name, bio, mode, plan)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     'demo',
--     'Demo User',
--     'This is a demo profile',
--     'ai',
--     'pro'
-- );
