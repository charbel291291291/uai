-- ============================================================
-- 06_ENABLE_REALTIME.sql
-- Enable Supabase Realtime for all tables
-- ============================================================

-- Enable Realtime for core tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- Enable Realtime for NFC orders
ALTER PUBLICATION supabase_realtime ADD TABLE nfc_orders;

-- Enable Realtime for subscriptions & payments
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable Realtime for AI conversations
ALTER PUBLICATION supabase_realtime ADD TABLE ai_conversations;

-- ============================================================
-- REALTIME CONFIGURATION
-- ============================================================

-- Set replica identity to full for all tables (needed for realtime DELETE events)
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
-- SETUP COMPLETE
-- ============================================================

-- Note: Make sure to enable Realtime in Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Ensure the supabase_realtime publication includes all tables
-- 3. Enable Realtime for your project in Project Settings
