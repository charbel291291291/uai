-- ============================================================
-- UAi - Complete Database Setup (Supabase SQL Editor Compatible)
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 01_CORE_TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    about_me TEXT,
    mode TEXT DEFAULT 'ai' CHECK (mode IN ('ai', 'landing', 'sales')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
    theme_color TEXT DEFAULT '#00C6FF',
    tone TEXT CHECK (tone IN ('professional', 'friendly', 'persuasive', 'casual', 'energetic')),
    goal TEXT CHECK (goal IN ('get-clients', 'book-calls', 'sell-service', 'build-network', 'share-knowledge')),
    ai_persona TEXT,
    qa_pairs JSONB DEFAULT '[]'::jsonb,
    services JSONB DEFAULT '[]'::jsonb,
    testimonials JSONB DEFAULT '[]'::jsonb,
    links JSONB DEFAULT '[]'::jsonb,
    featured_video_url TEXT,
    avatar_source TEXT CHECK (avatar_source IN ('upload', 'url', 'initials')),
    tags JSONB DEFAULT '[]'::jsonb,
    whatsapp TEXT,
    phone TEXT,
    analytics JSONB DEFAULT '{"views": 0, "chats": 0, "messages": 0, "leads": 0, "ctaClicks": 0}'::jsonb,
    is_private BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_mode ON profiles(mode);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_profile_id ON likes(profile_id);

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

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT NOT NULL,
    message TEXT,
    source TEXT DEFAULT 'profile',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_profile_id ON leads(profile_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ============================================================
-- 02_NFC_ORDERS
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
    tracking_number TEXT,
    shipping_carrier TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfc_orders_user_id ON nfc_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_status ON nfc_orders(status);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_created_at ON nfc_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_tracking ON nfc_orders(tracking_number);

-- ============================================================
-- 03_SUBSCRIPTIONS_PAYMENTS
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
-- 04_NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('nfc_order_update', 'payment_approved', 'payment_rejected', 'subscription_expiring', 'new_message')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- 05_AI_CONVERSATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    visitor_name TEXT,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_profile_id ON ai_conversations(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_visitor_id ON ai_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_message_at ON ai_conversations(last_message_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles
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

-- Likes
CREATE POLICY "Users can view their own likes"
    ON likes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create likes"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- Messages
CREATE POLICY "Profile owners can view their messages"
    ON messages FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can send messages"
    ON messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Profile owners can delete their messages"
    ON messages FOR DELETE
    USING (auth.uid() = profile_id);

-- Leads
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

-- NFC Orders
CREATE POLICY "Users can view their own orders"
    ON nfc_orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
    ON nfc_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending orders"
    ON nfc_orders FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all orders"
    ON nfc_orders FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

CREATE POLICY "Admins can update all orders"
    ON nfc_orders FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

-- Payment Requests
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

-- Subscriptions
CREATE POLICY "Users can view their own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
    ON subscriptions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

-- Notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- AI Conversations
CREATE POLICY "Profile owners can view their conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can create conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update active conversations"
    ON ai_conversations FOR UPDATE
    USING (status = 'active');

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

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Increment analytics
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

-- Approve payment request
CREATE OR REPLACE FUNCTION approve_payment_request(
    request_id UUID,
    admin_id UUID,
    notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_plan TEXT;
BEGIN
    SELECT user_id, plan INTO v_user_id, v_plan
    FROM payment_requests
    WHERE id = request_id AND status = 'pending';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Payment request not found or already processed';
    END IF;

    UPDATE payment_requests
    SET status = 'approved',
        reviewed_by = admin_id,
        reviewed_at = NOW(),
        admin_notes = notes
    WHERE id = request_id;

    INSERT INTO subscriptions (user_id, plan, status, expires_at, payment_request_id)
    VALUES (v_user_id, v_plan, 'active', NOW() + INTERVAL '30 days', request_id)
    ON CONFLICT (user_id)
    DO UPDATE SET
        plan = v_plan,
        status = 'active',
        expires_at = NOW() + INTERVAL '30 days',
        payment_request_id = request_id,
        updated_at = NOW();

    UPDATE profiles
    SET plan = v_plan
    WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS VOID AS $$
BEGIN
    UPDATE subscriptions
    SET status = 'expired'
    WHERE status = 'active' AND expires_at < NOW();

    UPDATE profiles
    SET plan = 'free'
    WHERE id IN (
        SELECT user_id FROM subscriptions
        WHERE status = 'expired' AND plan != 'free'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update NFC order
CREATE OR REPLACE FUNCTION update_nfc_order(
    order_id UUID,
    new_status TEXT,
    tracking_num TEXT DEFAULT NULL,
    carrier TEXT DEFAULT NULL,
    admin_note TEXT DEFAULT NULL,
    admin_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE nfc_orders
    SET
        status = new_status,
        tracking_number = COALESCE(tracking_num, tracking_number),
        shipping_carrier = COALESCE(carrier, shipping_carrier),
        shipped_at = CASE WHEN new_status = 'shipped' THEN NOW() ELSE shipped_at END,
        delivered_at = CASE WHEN new_status = 'delivered' THEN NOW() ELSE delivered_at END,
        admin_notes = COALESCE(admin_note, admin_notes),
        updated_by = admin_id,
        updated_at = NOW()
    WHERE id = order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NFC order notification
CREATE OR REPLACE FUNCTION notify_nfc_order_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.user_id,
            'nfc_order_update',
            CASE NEW.status
                WHEN 'processing' THEN 'Order Confirmed'
                WHEN 'shipped' THEN 'Order Shipped'
                WHEN 'delivered' THEN 'Order Delivered'
                ELSE 'Order Updated'
            END,
            CASE NEW.status
                WHEN 'processing' THEN 'Your NFC order is being processed.'
                WHEN 'shipped' THEN COALESCE('Your order has been shipped! Tracking: ' || NEW.tracking_number, 'Your order has been shipped!')
                WHEN 'delivered' THEN 'Your order has been delivered. Enjoy!'
                ELSE 'Your order status has been updated to ' || NEW.status
            END,
            jsonb_build_object(
                'order_id', NEW.id,
                'status', NEW.status,
                'tracking_number', NEW.tracking_number,
                'product_type', NEW.product_type
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER nfc_order_notification_trigger
    AFTER UPDATE ON nfc_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_nfc_order_update();

-- Payment notification
CREATE OR REPLACE FUNCTION notify_payment_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.user_id,
            CASE NEW.status
                WHEN 'approved' THEN 'payment_approved'
                ELSE 'payment_rejected'
            END,
            CASE NEW.status
                WHEN 'approved' THEN 'Payment Approved'
                ELSE 'Payment Rejected'
            END,
            CASE NEW.status
                WHEN 'approved' THEN 'Your payment has been approved! Your subscription is now active.'
                ELSE COALESCE('Your payment was rejected: ' || NEW.admin_notes, 'Your payment was rejected. Please try again.')
            END,
            jsonb_build_object(
                'payment_id', NEW.id,
                'plan', NEW.plan,
                'amount', NEW.amount
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER payment_notification_trigger
    AFTER UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_payment_update();

-- Add conversation message
CREATE OR REPLACE FUNCTION add_conversation_message(
    conv_id UUID,
    message_text TEXT,
    sender_type TEXT,
    sender_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE ai_conversations
    SET
        messages = messages || jsonb_build_array(jsonb_build_object(
            'id', gen_random_uuid(),
            'text', message_text,
            'sender', sender_type,
            'sender_name', sender_name,
            'timestamp', NOW()
        )),
        last_message_at = NOW()
    WHERE id = conv_id;

    IF sender_type = 'visitor' THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT
            profile_id,
            'new_message',
            'New Message',
            COALESCE(sender_name, 'Someone') || ' sent you a message',
            jsonb_build_object(
                'conversation_id', conv_id,
                'preview', LEFT(message_text, 100)
            )
        FROM ai_conversations
        WHERE id = conv_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_profile_id UUID,
    p_visitor_id TEXT,
    p_visitor_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    SELECT id INTO v_conversation_id
    FROM ai_conversations
    WHERE profile_id = p_profile_id
      AND visitor_id = p_visitor_id
      AND status = 'active'
    ORDER BY last_message_at DESC
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
        INSERT INTO ai_conversations (profile_id, visitor_id, visitor_name)
        VALUES (p_profile_id, p_visitor_id, p_visitor_name)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE nfc_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_conversations;

ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE likes REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE leads REPLICA IDENTITY FULL;
ALTER TABLE nfc_orders REPLICA IDENTITY FULL;
ALTER TABLE subscriptions REPLICA IDENTITY FULL;
ALTER TABLE payment_requests REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE ai_conversations REPLICA IDENTITY FULL;

-- ============================================================
-- STORAGE BUCKETS (Create in Supabase Dashboard)
-- ============================================================
-- 1. avatars - Public bucket for user avatars
-- 2. payment-proofs - Private bucket for payment screenshots
-- ============================================================

-- Setup complete!
