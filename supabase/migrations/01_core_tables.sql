-- ============================================================
-- 01_CORE_TABLES.sql
-- Core tables: profiles, likes, messages, leads
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
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
    is_admin BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_mode ON profiles(mode);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- ============================================================
-- LIKES TABLE
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
-- MESSAGES TABLE (Contact messages)
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
-- ============================================================
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
-- RLS POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

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
