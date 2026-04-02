-- ============================================================
-- 02_NFC_ORDERS.sql
-- NFC product orders with shipping tracking
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

    -- Shipping Information
    tracking_number TEXT,
    shipping_carrier TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    -- Admin Management
    admin_notes TEXT,
    updated_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfc_orders_user_id ON nfc_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_status ON nfc_orders(status);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_created_at ON nfc_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_tracking ON nfc_orders(tracking_number);

-- RLS for NFC Orders
ALTER TABLE nfc_orders ENABLE ROW LEVEL SECURITY;

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

-- Trigger for updated_at
CREATE TRIGGER update_nfc_orders_updated_at
    BEFORE UPDATE ON nfc_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update NFC order (for admin)
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
