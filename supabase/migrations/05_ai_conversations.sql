-- ============================================================
-- 05_AI_CONVERSATIONS.sql
-- Realtime AI chat conversations
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

-- RLS for AI Conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile owners can view their conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can create conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update active conversations"
    ON ai_conversations FOR UPDATE
    USING (status = 'active');

-- Function to add message to conversation
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

    -- Create notification for profile owner if message is from visitor
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

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_profile_id UUID,
    p_visitor_id TEXT,
    p_visitor_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Try to find existing active conversation
    SELECT id INTO v_conversation_id
    FROM ai_conversations
    WHERE profile_id = p_profile_id
      AND visitor_id = p_visitor_id
      AND status = 'active'
    ORDER BY last_message_at DESC
    LIMIT 1;

    -- Create new if not found
    IF v_conversation_id IS NULL THEN
        INSERT INTO ai_conversations (profile_id, visitor_id, visitor_name)
        VALUES (p_profile_id, p_visitor_id, p_visitor_name)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
