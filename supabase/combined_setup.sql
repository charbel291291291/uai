-- ============================================================
-- UAi - Complete Database Setup (Supabase SQL Editor Compatible)
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STEP 1: CREATE ALL TABLES
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

CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, profile_id)
);

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

-- ============================================================
-- STEP 2: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_mode ON profiles(mode);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_profile_id ON messages(profile_id);
CREATE INDEX IF NOT EXISTS idx_leads_profile_id ON leads(profile_id);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_user_id ON nfc_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_status ON nfc_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_profile_id ON ai_conversations(profile_id);

-- ============================================================
-- STEP 3: RLS ENABLE
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

-- ============================================================
-- STEP 4: RLS POLICIES
-- ============================================================

CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (NOT is_private OR auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Users can view their own likes" ON likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Profile owners can view their messages" ON messages FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Anyone can send messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Profile owners can delete their messages" ON messages FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Profile owners can view their leads" ON leads FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Anyone can create leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Profile owners can update their leads" ON leads FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Profile owners can delete their leads" ON leads FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Users can view their own orders" ON nfc_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON nfc_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending orders" ON nfc_orders FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can view all orders" ON nfc_orders FOR SELECT USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can update all orders" ON nfc_orders FOR UPDATE USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own payment requests" ON payment_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payment requests" ON payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payment requests" ON payment_requests FOR SELECT USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can update payment requests" ON payment_requests FOR UPDATE USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Profile owners can view their conversations" ON ai_conversations FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Anyone can create conversations" ON ai_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update active conversations" ON ai_conversations FOR UPDATE USING (status = 'active');

-- ============================================================
-- STEP 5: BASIC FUNCTIONS (no column references)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION increment_profile_analytics(profile_uuid UUID, field TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles SET analytics = jsonb_set(analytics, ARRAY[field], COALESCE(analytics->field, '0')::int + 1) WHERE id = profile_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 6: BASIC TRIGGERS (only updated_at)
-- ============================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nfc_orders_updated_at BEFORE UPDATE ON nfc_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 7: ADMIN FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION approve_payment_request(request_id UUID, admin_id UUID, notes TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_plan TEXT;
BEGIN
    SELECT user_id, plan INTO v_user_id, v_plan FROM payment_requests WHERE id = request_id AND status = 'pending';
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Payment request not found or already processed';
    END IF;
    UPDATE payment_requests SET status = 'approved', reviewed_by = admin_id, reviewed_at = NOW(), admin_notes = notes WHERE id = request_id;
    INSERT INTO subscriptions (user_id, plan, status, expires_at, payment_request_id)
    VALUES (v_user_id, v_plan, 'active', NOW() + INTERVAL '30 days', request_id)
    ON CONFLICT (user_id) DO UPDATE SET plan = v_plan, status = 'active', expires_at = NOW() + INTERVAL '30 days', payment_request_id = request_id, updated_at = NOW();
    UPDATE profiles SET plan = v_plan WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS VOID AS $$
BEGIN
    UPDATE subscriptions SET status = 'expired' WHERE status = 'active' AND expires_at < NOW();
    UPDATE profiles SET plan = 'free' WHERE id IN (SELECT user_id FROM subscriptions WHERE status = 'expired' AND plan != 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_nfc_order(order_id UUID, new_status TEXT, tracking_num TEXT DEFAULT NULL, carrier TEXT DEFAULT NULL, admin_note TEXT DEFAULT NULL, admin_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE nfc_orders SET
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

-- ============================================================
-- STEP 8: NOTIFICATION FUNCTIONS (separate to avoid trigger issues)
-- ============================================================

CREATE OR REPLACE FUNCTION notify_nfc_order_update()
RETURNS TRIGGER AS $$
DECLARE
    old_status TEXT;
    new_status TEXT;
    user_uuid UUID;
    tracking TEXT;
    product TEXT;
    order_uuid UUID;
BEGIN
    old_status := OLD.status;
    new_status := NEW.status;
    user_uuid := NEW.user_id;
    tracking := NEW.tracking_number;
    product := NEW.product_type;
    order_uuid := NEW.id;
    
    IF old_status IS DISTINCT FROM new_status THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            user_uuid,
            'nfc_order_update',
            CASE new_status
                WHEN 'processing' THEN 'Order Confirmed'
                WHEN 'shipped' THEN 'Order Shipped'
                WHEN 'delivered' THEN 'Order Delivered'
                ELSE 'Order Updated'
            END,
            CASE new_status
                WHEN 'processing' THEN 'Your NFC order is being processed.'
                WHEN 'shipped' THEN COALESCE('Your order has been shipped! Tracking: ' || tracking, 'Your order has been shipped!')
                WHEN 'delivered' THEN 'Your order has been delivered. Enjoy!'
                ELSE 'Your order status has been updated to ' || new_status
            END,
            jsonb_build_object('order_id', order_uuid, 'status', new_status, 'tracking_number', tracking, 'product_type', product)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_payment_update()
RETURNS TRIGGER AS $$
DECLARE
    old_status TEXT;
    new_status TEXT;
    user_uuid UUID;
    admin_note TEXT;
    plan_type TEXT;
    amount_val DECIMAL;
    payment_uuid UUID;
BEGIN
    old_status := OLD.status;
    new_status := NEW.status;
    user_uuid := NEW.user_id;
    admin_note := NEW.admin_notes;
    plan_type := NEW.plan;
    amount_val := NEW.amount;
    payment_uuid := NEW.id;
    
    IF old_status IS DISTINCT FROM new_status AND new_status IN ('approved', 'rejected') THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            user_uuid,
            CASE new_status WHEN 'approved' THEN 'payment_approved' ELSE 'payment_rejected' END,
            CASE new_status WHEN 'approved' THEN 'Payment Approved' ELSE 'Payment Rejected' END,
            CASE new_status
                WHEN 'approved' THEN 'Your payment has been approved! Your subscription is now active.'
                ELSE COALESCE('Your payment was rejected: ' || admin_note, 'Your payment was rejected. Please try again.')
            END,
            jsonb_build_object('payment_id', payment_uuid, 'plan', plan_type, 'amount', amount_val)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 9: NOTIFICATION TRIGGERS (after functions exist)
-- ============================================================

DROP TRIGGER IF EXISTS nfc_order_notification_trigger ON nfc_orders;
CREATE TRIGGER nfc_order_notification_trigger AFTER UPDATE ON nfc_orders FOR EACH ROW EXECUTE FUNCTION notify_nfc_order_update();

DROP TRIGGER IF EXISTS payment_notification_trigger ON payment_requests;
CREATE TRIGGER payment_notification_trigger AFTER UPDATE ON payment_requests FOR EACH ROW EXECUTE FUNCTION notify_payment_update();

-- ============================================================
-- STEP 10: CONVERSATION FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION add_conversation_message(conv_id UUID, message_text TEXT, sender_type TEXT, sender_name TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    profile_uuid UUID;
BEGIN
    UPDATE ai_conversations SET
        messages = messages || jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'text', message_text, 'sender', sender_type, 'sender_name', sender_name, 'timestamp', NOW())),
        last_message_at = NOW()
    WHERE id = conv_id
    RETURNING profile_id INTO profile_uuid;

    IF sender_type = 'visitor' THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (profile_uuid, 'new_message', 'New Message', COALESCE(sender_name, 'Someone') || ' sent you a message', jsonb_build_object('conversation_id', conv_id, 'preview', LEFT(message_text, 100)));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_or_create_conversation(p_profile_id UUID, p_visitor_id TEXT, p_visitor_name TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    SELECT id INTO v_conversation_id FROM ai_conversations WHERE profile_id = p_profile_id AND visitor_id = p_visitor_id AND status = 'active' ORDER BY last_message_at DESC LIMIT 1;
    IF v_conversation_id IS NULL THEN
        INSERT INTO ai_conversations (profile_id, visitor_id, visitor_name) VALUES (p_profile_id, p_visitor_id, p_visitor_name) RETURNING id INTO v_conversation_id;
    END IF;
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 11: ENABLE REALTIME
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

-- Setup complete!
