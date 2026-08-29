-- ============================================================================
-- Migration: 012_create_note_purchases.sql
-- Description: Creates the 'note_purchases' join table tracking standalone digital note entitlements.
-- Relationship: Many Users can purchase Many Notes (Many-to-Many via Note Purchases).
-- ============================================================================

CREATE TABLE IF NOT EXISTS note_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    note_id UUID NOT NULL,
    order_id UUID,
    price_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price_paid >= 0),
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_note_purchases_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_note_purchases_note 
        FOREIGN KEY (note_id) 
        REFERENCES notes(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_note_purchases_order 
        FOREIGN KEY (order_id) 
        REFERENCES orders(id) 
        ON DELETE SET NULL,

    -- Unique Constraint: A student cannot purchase the exact same note twice
    CONSTRAINT uq_user_note_purchase UNIQUE (user_id, note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_purchases_user_id ON note_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_note_purchases_note_id ON note_purchases(note_id);
