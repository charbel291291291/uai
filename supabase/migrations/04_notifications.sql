-- ============================================================
-- 04_NOTIFICATIONS.sql
-- User notification system
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

-- RLS for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Function to create notification on NFC order update
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

-- Trigger for NFC order notifications
CREATE TRIGGER nfc_order_notification_trigger
    AFTER UPDATE ON nfc_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_nfc_order_update();

-- Function to create notification on payment approval/rejection
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

-- Trigger for payment notifications
CREATE TRIGGER payment_notification_trigger
    AFTER UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_payment_update();
