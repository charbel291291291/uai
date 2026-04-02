-- ============================================================
-- UAi - Complete Supabase Setup
-- Run this file to set up your entire database
-- ============================================================

-- 1. Core tables (profiles, likes, messages, leads)
\i migrations/01_core_tables.sql

-- 2. NFC orders system
\i migrations/02_nfc_orders.sql

-- 3. Subscriptions & payments
\i migrations/03_subscriptions_payments.sql

-- 4. Notifications system
\i migrations/04_notifications.sql

-- 5. AI conversations (realtime)
\i migrations/05_ai_conversations.sql

-- 6. Enable realtime
\i migrations/06_enable_realtime.sql

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================

-- Next steps:
-- 1. Create storage buckets in Supabase Dashboard:
--    - avatars (public)
--    - payment-proofs (private)
--
-- 2. Set your admin user:
--    UPDATE profiles SET is_admin = true WHERE username = 'your_username';
--
-- 3. Enable Realtime in Supabase Dashboard:
--    - Go to Database > Replication
--    - Confirm supabase_realtime publication exists
--
-- 4. Set up your environment variables:
--    VITE_SUPABASE_URL=your-project-url
--    VITE_SUPABASE_ANON_KEY=your-anon-key
