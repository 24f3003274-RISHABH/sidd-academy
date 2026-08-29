-- ============================================================================
-- Migration: 010_create_order_items.sql
-- Description: Creates the 'order_items' table breaking down line items inside an order.
-- Relationship: Many Order Items belong to 1 Order (Many-to-One).
-- Polymorphic Item Reference: item_type ('course' | 'note') + item_id (UUID)
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('course', 'note')),
    item_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraint with Cascade on Delete
    CONSTRAINT fk_order_items_order 
        FOREIGN KEY (order_id) 
        REFERENCES orders(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items(item_type, item_id);
