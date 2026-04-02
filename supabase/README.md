# Supabase Setup Guide

## Quick Start

Run the SQL files in this order:

```sql
-- 1. Core tables (profiles, auth)
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
```

Or run all at once:
```sql
\i setup.sql
```

## Features

| Feature | File | Description |
|---------|------|-------------|
| Core | `01_core_tables.sql` | Profiles, likes, messages, leads |
| NFC | `02_nfc_orders.sql` | NFC product orders with tracking |
| Payments | `03_subscriptions_payments.sql` | Subscriptions, payment requests |
| Notifications | `04_notifications.sql` | User notification system |
| AI Chat | `05_ai_conversations.sql` | Realtime conversations |
| Realtime | `06_enable_realtime.sql` | Enable realtime for all tables |

## Admin Setup

After running migrations, set your admin user:

```sql
UPDATE profiles
SET is_admin = true
WHERE username = 'your_username';
```

## Storage Buckets

Create these buckets in Supabase Dashboard:
- `avatars` - Public, for user avatars
- `payment-proofs` - Private, for payment screenshots
